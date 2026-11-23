#include <stdint.h>
#include <vector>
#include <android/log.h>

// MediaPipe & TensorFlow Lite Headers (Assumed available in NDK build environment)
#include "mediapipe/framework/calculator_graph.h"
#include "mediapipe/framework/port/status.h"
#include "mediapipe/gpu/gl_calculator_helper.h"
#include "mediapipe/gpu/gpu_buffer.h"
#include "mediapipe/gpu/gpu_shared_data_internal.h"

#define LOG_TAG "FutureGymNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace fitness_future {

class NativePoseEngine {
private:
    mediapipe::CalculatorGraph graph;
    std::shared_ptr<mediapipe::GpuResources> gpu_resources;

public:
    NativePoseEngine() {}

    bool Initialize(const char* model_path, bool use_npu) {
        LOGI("Initializing Native Pose Engine (C++)");
        
        // 1. ADVANCED: Initialize GPU/NPU Resources to offload CPU
        ASSIGN_OR_RETURN(gpu_resources, mediapipe::GpuResources::Create());
        
        // Configure graph to use NNAPI (Android Neural Networks API) for budget phones
        // This shifts the 33-joint calculation to the DSP/NPU, saving CPU and battery.
        mediapipe::CalculatorGraphConfig config;
        // ... (Load config from model_path, inject TfLiteGpuDelegate or NnapiDelegate)
        
        auto status = graph.Initialize(config);
        if (!status.ok()) {
            LOGE("Failed to initialize graph: %s", status.message().data());
            return false;
        }

        status = graph.SetGpuResources(gpu_resources);
        if (!status.ok()) return false;

        return graph.StartRun({}).ok();
    }

    // 2. ADVANCED: Direct Memory Access via Pointer (No Serialization Overhead)
    int ProcessFrameFast(const uint8_t* image_data, int width, int height, float* out_landmarks) {
        // Wrap raw bytes directly into a GPU buffer (Zero-copy if possible)
        // Run inference
        // Extract 33 landmarks (x, y, z, visibility) -> 33 * 4 = 132 floats
        
        // Mocking the extraction for demonstration:
        // In reality, this reads from the graph's output stream.
        for(int i=0; i<132; i++) {
            out_landmarks[i] = 0.5f; // Dummy data
        }
        
        return 1; // Success
    }
};

} // namespace fitness_future

// ============================================================================
// C-API EXPORT FOR DART FFI (Foreign Function Interface)
// ============================================================================
extern "C" {

fitness_future::NativePoseEngine* engine = nullptr;

__attribute__((visibility("default"))) __attribute__((used))
int init_native_engine(const char* model_path, int use_npu) {
    if (engine == nullptr) {
        engine = new fitness_future::NativePoseEngine();
    }
    return engine->Initialize(model_path, use_npu == 1) ? 1 : 0;
}

__attribute__((visibility("default"))) __attribute__((used))
int process_frame_ffi(const uint8_t* image_data, int width, int height, float* out_landmarks) {
    if (engine == nullptr) return 0;
    return engine->ProcessFrameFast(image_data, width, height, out_landmarks);
}

}
