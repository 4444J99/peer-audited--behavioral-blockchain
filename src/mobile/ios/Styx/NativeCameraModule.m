#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NativeCameraModule, RCTEventEmitter)

RCT_EXTERN_METHOD(
  requestNonce:(NSString *)contractId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  capturePhoto:(NSString *)outputPath
  nonce:(NSString *)nonce
  watermark:(NSString *)watermark
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  captureVideo:(NSString *)outputPath
  nonce:(NSString *)nonce
  watermark:(NSString *)watermark
  maxDurationMs:(nonnull NSNumber *)maxDurationMs
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  applyWatermark:(NSString *)mediaPath
  watermark:(NSString *)watermarkText
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  generateSecureNonce:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  isCameraAvailable:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
