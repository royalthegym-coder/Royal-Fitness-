import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'native_pose_tracker.dart';

// ============================================================================
// DYNAMIC THERMAL & PERFORMANCE THROTTLING
// ============================================================================

class AdaptivePoseTracker {
  final NativePoseTracker _nativeTracker = NativePoseTracker();
  bool _isProcessing = false;
  int _targetFps = 30;
  int _consecutiveSlowFrames = 0;
  
  // Thresholds for budget phones (₹15k-₹20k)
  static const int MAX_PROCESSING_TIME_MS = 40; // If > 40ms, phone is struggling
  static const int MIN_FPS = 12; // Don't drop below 12 FPS for smooth tracking

  AdaptivePoseTracker() {
    _nativeTracker.initialize('assets/models/pose_landmark_lite.tflite', useNpu: true);
  }

  /// Called by the Camera Stream (e.g., camera controller image stream)
  Future<Float32List?> processCameraFrame(Uint8List imageBytes, int width, int height) async {
    // 1. Frame Dropping: If previous frame is still processing, DROP this one.
    // This prevents the CPU queue from filling up and causing OOM/Thermal Throttling.
    if (_isProcessing) return null;
    
    _isProcessing = true;
    final stopwatch = Stopwatch()..start();

    try {
      // 2. Run Inference via C++ NDK
      final landmarks = await compute(_runNativeInference, {
        'tracker': _nativeTracker,
        'bytes': imageBytes,
        'width': width,
        'height': height,
      });

      stopwatch.stop();
      _adjustPerformance(stopwatch.elapsedMilliseconds);

      return landmarks;
    } finally {
      _isProcessing = false;
    }
  }

  /// Runs the FFI call in an Isolate to keep the Flutter UI thread at 60fps
  static Float32List _runNativeInference(Map<String, dynamic> args) {
    final NativePoseTracker tracker = args['tracker'];
    final Uint8List bytes = args['bytes'];
    final int width = args['width'];
    final int height = args['height'];
    
    return tracker.processFrame(bytes, width, height);
  }

  /// 3. Adaptive Throttling Logic
  void _adjustPerformance(int processingTimeMs) {
    if (processingTimeMs > MAX_PROCESSING_TIME_MS) {
      _consecutiveSlowFrames++;
      if (_consecutiveSlowFrames > 5 && _targetFps > MIN_FPS) {
        // Phone is heating up or CPU is maxed out. Drop FPS.
        _targetFps -= 2;
        _consecutiveSlowFrames = 0;
        debugPrint('⚠️ Thermal Throttling: Dropping to $_targetFps FPS');
      }
    } else {
      _consecutiveSlowFrames = 0;
      if (_targetFps < 30) {
        // Phone cooled down, slowly increase FPS.
        _targetFps += 1;
        debugPrint('✅ Performance Recovered: Increasing to $_targetFps FPS');
      }
    }
  }
}
