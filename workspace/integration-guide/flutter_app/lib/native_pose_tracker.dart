import 'dart:ffi' as ffi;
import 'dart:io';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';

// ============================================================================
// DART FFI BRIDGE: Bypassing MethodChannels for 100x Faster Execution
// ============================================================================

typedef InitNativeEngineC = ffi.Int32 Function(ffi.Pointer<Utf8> modelPath, ffi.Int32 useNpu);
typedef InitNativeEngineDart = int Function(ffi.Pointer<Utf8> modelPath, int useNpu);

typedef ProcessFrameFfiC = ffi.Int32 Function(
    ffi.Pointer<ffi.Uint8> imageData,
    ffi.Int32 width,
    ffi.Int32 height,
    ffi.Pointer<ffi.Float> outLandmarks);

typedef ProcessFrameFfiDart = int Function(
    ffi.Pointer<ffi.Uint8> imageData,
    int width,
    int height,
    ffi.Pointer<ffi.Float> outLandmarks);

class NativePoseTracker {
  late ffi.DynamicLibrary _lib;
  late InitNativeEngineDart _initEngine;
  late ProcessFrameFfiDart _processFrame;

  // Pre-allocate memory for 33 landmarks * 4 (x, y, z, visibility) = 132 floats
  // This prevents Garbage Collection (GC) pauses during inference.
  final ffi.Pointer<ffi.Float> _landmarkBuffer = calloc<ffi.Float>(132);

  NativePoseTracker() {
    _lib = Platform.isAndroid
        ? ffi.DynamicLibrary.open('libfitness_future_native.so')
        : ffi.DynamicLibrary.process();

    _initEngine = _lib
        .lookup<ffi.NativeFunction<InitNativeEngineC>>('init_native_engine')
        .asFunction();

    _processFrame = _lib
        .lookup<ffi.NativeFunction<ProcessFrameFfiC>>('process_frame_ffi')
        .asFunction();
  }

  bool initialize(String modelPath, {bool useNpu = true}) {
    final pathPtr = modelPath.toNativeUtf8();
    final result = _initEngine(pathPtr, useNpu ? 1 : 0);
    calloc.free(pathPtr);
    return result == 1;
  }

  /// Processes a camera frame directly via FFI (Zero Serialization Overhead)
  Float32List processFrame(Uint8List imageBytes, int width, int height) {
    // 1. Allocate memory for the image frame
    final imgPtr = calloc<ffi.Uint8>(imageBytes.length);
    
    // 2. Copy bytes to native memory
    final nativeList = imgPtr.asTypedList(imageBytes.length);
    nativeList.setAll(0, imageBytes);

    // 3. Execute C++ Inference on GPU/NPU
    final status = _processFrame(imgPtr, width, height, _landmarkBuffer);

    // 4. Free image memory immediately to prevent OOM
    calloc.free(imgPtr);

    if (status == 1) {
      // 5. Read the 132 floats directly from the C++ memory pointer
      return _landmarkBuffer.asTypedList(132);
    }
    return Float32List(0);
  }

  void dispose() {
    calloc.free(_landmarkBuffer);
  }
}
