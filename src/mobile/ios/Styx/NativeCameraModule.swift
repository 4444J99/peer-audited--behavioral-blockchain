import Foundation
import AVFoundation
import UIKit
import CoreImage
import CoreGraphics

@objc(NativeCameraModule)
class NativeCameraModule: RCTEventEmitter {

  private var captureSession: AVCaptureSession?
  private var photoOutput: AVCapturePhotoOutput?
  private var videoOutput: AVCaptureMovieFileOutput?
  private var isRecording = false
  private var pendingResolve: RCTPromiseResolveBlock?
  private var pendingReject: RCTPromiseRejectBlock?
  private var currentNonce: String?
  private var currentWatermark: String?
  private var photoOutputPath: String?
  private var videoOutputPath: String?

  override func supportedEvents() -> [String] {
    return ["onCameraReady", "onCaptureProgress", "onCaptureError"]
  }

  @objc func generateSecureNonce(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    var randomBytes = [UInt8](repeating: 0, count: 32)
    let status = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
    if status == errSecSuccess {
      let nonce = randomBytes.map { String(format: "%02x", $0) }.joined()
      resolve(nonce)
    } else {
      reject("NONCE_ERROR", "Failed to generate secure random bytes", nil)
    }
  }

  @objc func requestNonce(
    _ contractId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    var randomBytes = [UInt8](repeating: 0, count: 16)
    let status = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
    if status == errSecSuccess {
      let nonceHex = randomBytes.map { String(format: "%02x", $0) }.joined()
      let timestamp = Int64(Date().timeIntervalSince1970 * 1000)
      let noncePayload = "STYX::\(nonceHex)::\(timestamp)::\(sanitizeSegment(contractId))"
      let result: [String: Any] = [
        "nonce": noncePayload,
        "raw": nonceHex,
        "expiresAt": timestamp + 120_000,
      ]
      resolve(result)
    } else {
      reject("NONCE_ERROR", "Failed to generate secure nonce", nil)
    }
  }

  @objc func isCameraAvailable(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let status = AVCaptureDevice.authorizationStatus(for: .video)
    let isAvailable = UIImagePickerController.isSourceTypeAvailable(.camera)
    resolve([
      "available": isAvailable,
      "authorized": status == .authorized,
      "notDetermined": status == .notDetermined,
    ])
  }

  @objc func capturePhoto(
    _ outputPath: String,
    nonce: String,
    watermark: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    checkCameraPermission { [weak self] granted in
      guard granted else {
        reject("PERMISSION_DENIED", "Camera access denied", nil)
        return
      }
      self?.capturePhotoInternal(outputPath: outputPath, nonce: nonce, watermark: watermark, resolve: resolve, reject: reject)
    }
  }

  @objc func captureVideo(
    _ outputPath: String,
    nonce: String,
    watermark: String,
    maxDurationMs: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    checkCameraPermission { [weak self] granted in
      guard granted else {
        reject("PERMISSION_DENIED", "Camera access denied", nil)
        return
      }
      self?.captureVideoInternal(outputPath: outputPath, nonce: nonce, watermark: watermark, maxDurationMs: maxDurationMs.doubleValue / 1000.0, resolve: resolve, reject: reject)
    }
  }

  @objc func applyWatermark(
    _ mediaPath: String,
    watermark watermarkText: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let url = URL(fileURLWithPath: mediaPath)
    guard FileManager.default.fileExists(atPath: mediaPath) else {
      reject("FILE_NOT_FOUND", "Media file not found at path", nil)
      return
    }

    if mediaPath.hasSuffix(".mp4") || mediaPath.hasSuffix(".mov") {
      applyVideoWatermark(inputUrl: url, watermark: watermarkText, resolve: resolve, reject: reject)
    } else if mediaPath.hasSuffix(".jpg") || mediaPath.hasSuffix(".jpeg") || mediaPath.hasSuffix(".png") {
      applyImageWatermark(inputUrl: url, watermark: watermarkText, resolve: resolve, reject: reject)
    } else {
      reject("UNSUPPORTED_FORMAT", "Unsupported media format for watermarking", nil)
    }
  }

  // MARK: - Private

  private func checkCameraPermission(completion: @escaping (Bool) -> Void) {
    let status = AVCaptureDevice.authorizationStatus(for: .video)
    switch status {
    case .authorized:
      completion(true)
    case .notDetermined:
      AVCaptureDevice.requestAccess(for: .video) { granted in
        DispatchQueue.main.async {
          completion(granted)
        }
      }
    default:
      completion(false)
    }
  }

  private func capturePhotoInternal(
    outputPath: String,
    nonce: String,
    watermark: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let session = AVCaptureSession()
    session.sessionPreset = .photo

    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
      reject("CAMERA_ERROR", "No back camera available", nil)
      return
    }

    do {
      let input = try AVCaptureDeviceInput(device: device)
      guard session.canAddInput(input) else {
        reject("CAMERA_ERROR", "Cannot add camera input", nil)
        return
      }
      session.addInput(input)

      let photoOutput = AVCapturePhotoOutput()
      guard session.canAddOutput(photoOutput) else {
        reject("CAMERA_ERROR", "Cannot add photo output", nil)
        return
      }
      session.addOutput(photoOutput)

      self.photoOutput = photoOutput
      self.pendingResolve = resolve
      self.pendingReject = reject
      self.currentNonce = nonce
      self.currentWatermark = watermark
      self.photoOutputPath = outputPath

      let photoSettings = AVCapturePhotoSettings()
      photoSettings.flashMode = .auto

      session.startRunning()
      self.captureSession = session

      photoOutput.capturePhoto(with: photoSettings, delegate: self)
    } catch {
      reject("CAMERA_ERROR", "Failed to configure camera: \(error.localizedDescription)", error)
    }
  }

  private func captureVideoInternal(
    outputPath: String,
    nonce: String,
    watermark: String,
    maxDurationMs: TimeInterval,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let session = AVCaptureSession()
    session.sessionPreset = .high

    guard let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
          let audioDevice = AVCaptureDevice.default(for: .audio) else {
      reject("CAMERA_ERROR", "No camera or microphone available", nil)
      return
    }

    do {
      let videoInput = try AVCaptureDeviceInput(device: videoDevice)
      guard session.canAddInput(videoInput) else {
        reject("CAMERA_ERROR", "Cannot add video input", nil)
        return
      }
      session.addInput(videoInput)

      let audioInput = try AVCaptureDeviceInput(device: audioDevice)
      if session.canAddInput(audioInput) {
        session.addInput(audioInput)
      }

      let movieOutput = AVCaptureMovieFileOutput()
      guard session.canAddOutput(movieOutput) else {
        reject("CAMERA_ERROR", "Cannot add movie output", nil)
        return
      }
      session.addOutput(movieOutput)

      if let connection = movieOutput.connection(with: .video), connection.isVideoStabilizationSupported {
        connection.preferredVideoStabilizationMode = .auto
      }

      self.videoOutput = movieOutput
      self.pendingResolve = resolve
      self.pendingReject = reject
      self.currentNonce = nonce
      self.currentWatermark = watermark
      self.videoOutputPath = outputPath
      self.isRecording = true

      session.startRunning()
      self.captureSession = session

      let outputUrl = URL(fileURLWithPath: outputPath)
      try? FileManager.default.removeItem(at: outputUrl)
      movieOutput.startRecording(to: outputUrl, recordingDelegate: self)

      let maxDuration = maxDurationMs > 0 ? maxDurationMs : 30
      DispatchQueue.main.asyncAfter(deadline: .now() + maxDuration) { [weak self] in
        if self?.isRecording == true {
          self?.stopVideoCapture()
        }
      }
    } catch {
      reject("CAMERA_ERROR", "Failed to configure video: \(error.localizedDescription)", error)
    }
  }

  private func stopVideoCapture() {
    guard isRecording else { return }
    isRecording = false
    videoOutput?.stopRecording()
  }

  private func applyImageWatermark(
    inputUrl: URL,
    watermark: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let image = UIImage(contentsOfFile: inputUrl.path),
          let ciImage = CIImage(image: image) else {
      reject("IMAGE_ERROR", "Failed to load image", nil)
      return
    }

    let watermarkText = watermark
    let width = ciImage.extent.width
    let height = ciImage.extent.height

    let context = CIContext()
    guard let textImage = createTextImage(
      text: watermarkText,
      fontSize: min(width, height) * 0.035,
      width: width,
      height: height
    ) else {
      resolve(inputUrl.path)
      return
    }

    let textFilter = CIFilter(name: "CISourceOverCompositing")!
    textFilter.setValue(textImage, forKey: kCIInputImageKey)
    textFilter.setValue(ciImage, forKey: kCIInputBackgroundImageKey)

    if let outputImage = textFilter.outputImage,
       let cgImage = context.createCGImage(outputImage, from: outputImage.extent) {
      let resultImage = UIImage(cgImage: cgImage)
      if let jpegData = resultImage.jpegData(compressionQuality: 0.92) {
        try? jpegData.write(to: inputUrl)
      }
    }

    resolve(inputUrl.path)
  }

  private func applyVideoWatermark(
    inputUrl: URL,
    watermark: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let asset = AVAsset(url: inputUrl)
    let composition = AVMutableComposition()
    let videoTrack = asset.tracks(withMediaType: .video).first

    guard let sourceVideoTrack = videoTrack else {
      resolve(inputUrl.path)
      return
    }

    let compositionVideoTrack = composition.addMutableTrack(
      withMediaType: .video,
      preferredTrackID: kCMPersistentTrackID_Invalid
    )
    try? compositionVideoTrack?.insertTimeRange(
      CMTimeRange(start: .zero, duration: asset.duration),
      of: sourceVideoTrack,
      at: .zero
    )

    let size = sourceVideoTrack.naturalSize
    let watermarkLayer = createVideoWatermarkLayer(
      text: watermark,
      size: size
    )

    let videoLayer = CALayer()
    videoLayer.frame = CGRect(origin: .zero, size: size)
    videoLayer.addSublayer(watermarkLayer)

    let parentLayer = CALayer()
    parentLayer.frame = CGRect(origin: .zero, size: size)
    parentLayer.addSublayer(videoLayer)

    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)

    let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: compositionVideoTrack!)
    instruction.layerInstructions = [layerInstruction]

    let videoComposition = AVMutableVideoComposition()
    videoComposition.frameDuration = CMTime(value: 1, timescale: 30)
    videoComposition.renderSize = size
    videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(
      postProcessingAsVideoLayer: videoLayer,
      in: parentLayer
    )
    videoComposition.instructions = [instruction]

    let outputUrl = URL(fileURLWithPath: inputUrl.path.replacingOccurrences(of: ".mp4", with: "-watermarked.mp4"))
    try? FileManager.default.removeItem(at: outputUrl)

    guard let exportSession = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality
    ) else {
      resolve(inputUrl.path)
      return
    }

    exportSession.videoComposition = videoComposition
    exportSession.outputURL = outputUrl
    exportSession.outputFileType = .mp4

    exportSession.exportAsynchronously { [weak self] in
      DispatchQueue.main.async {
        switch exportSession.status {
        case .completed:
          resolve(outputUrl.path)
        case .failed:
          reject("EXPORT_ERROR", "Video watermark export failed: \(exportSession.error?.localizedDescription ?? "unknown")", exportSession.error)
        default:
          reject("EXPORT_ERROR", "Video watermark export did not complete", nil)
        }
      }
    }
  }

  private func createTextImage(text: String, fontSize: CGFloat, width: CGFloat, height: CGFloat) -> CIImage? {
    let textLayer = CATextLayer()
    textLayer.string = text
    textLayer.fontSize = fontSize
    textLayer.foregroundColor = UIColor.white.cgColor
    textLayer.opacity = 0.7
    textLayer.backgroundColor = UIColor.clear.cgColor
    textLayer.frame = CGRect(x: 0, y: height * 0.03, width: width * 0.95, height: fontSize * 4)
    textLayer.contentsScale = UIScreen.main.scale
    textLayer.alignmentMode = .left
    textLayer.isWrapped = true
    textLayer.shadowColor = UIColor.black.cgColor
    textLayer.shadowOpacity = 0.8
    textLayer.shadowOffset = CGSize(width: 1, height: 1)
    textLayer.shadowRadius = 2

    let layer = CALayer()
    layer.frame = CGRect(x: 0, y: 0, width: width, height: height)
    layer.backgroundColor = UIColor.clear.cgColor
    layer.addSublayer(textLayer)

    UIGraphicsBeginImageContext(CGSize(width: width, height: height))
    guard let context = UIGraphicsGetCurrentContext() else {
      UIGraphicsEndImageContext()
      return nil
    }
    layer.render(in: context)
    let renderedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    guard let cgImage = renderedImage?.cgImage else { return nil }
    return CIImage(cgImage: cgImage)
  }

  private func createVideoWatermarkLayer(text: String, size: CGSize) -> CALayer {
    let textLayer = CATextLayer()
    textLayer.string = text
    textLayer.fontSize = size.width * 0.035
    textLayer.foregroundColor = UIColor.white.cgColor
    textLayer.opacity = 0.8
    textLayer.backgroundColor = UIColor.clear.cgColor
    textLayer.frame = CGRect(x: size.width * 0.03, y: size.height * 0.88, width: size.width * 0.94, height: size.height * 0.1)
    textLayer.contentsScale = UIScreen.main.scale
    textLayer.alignmentMode = .left
    textLayer.isWrapped = true
    textLayer.shadowColor = UIColor.black.cgColor
    textLayer.shadowOpacity = 0.8
    textLayer.shadowOffset = CGSize(width: 1, height: 1)
    textLayer.shadowRadius = 2
    return textLayer
  }

  private func sanitizeSegment(_ value: String) -> String {
    return value.trimmingCharacters(in: .whitespacesAndNewlines)
      .lowercased()
      .components(separatedBy: CharacterSet.alphanumerics.inverted)
      .joined(separator: "-")
      .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }
}

// MARK: - AVCapturePhotoCaptureDelegate

extension NativeCameraModule: AVCapturePhotoCaptureDelegate {
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    captureSession?.stopRunning()
    captureSession = nil

    if let error = error {
      pendingReject?("CAPTURE_ERROR", "Photo capture failed: \(error.localizedDescription)", error)
      clearPending()
      return
    }

    guard let imageData = photo.fileDataRepresentation() else {
      pendingReject?("CAPTURE_ERROR", "Failed to get photo data", nil)
      clearPending()
      return
    }

    let outputPath = self.photoOutputPath ?? NSTemporaryDirectory().appending("/styx_capture_\(Date().timeIntervalSince1970).jpg")
    let outputUrl = URL(fileURLWithPath: outputPath)

    do {
      // Apply watermark before saving
      guard let image = UIImage(data: imageData),
            let ciImage = CIImage(image: image) else {
        try imageData.write(to: outputUrl)
        let result: [String: Any] = [
          "path": outputPath,
          "nonce": currentNonce ?? "",
          "width": 0,
          "height": 0,
        ]
        pendingResolve?(result)
        clearPending()
        return
      }

      let watermarkText = currentWatermark ?? "STYX//\(currentNonce ?? "unknown")"
      let width = ciImage.extent.width
      let height = ciImage.extent.height
      let context = CIContext()

      if let textImage = createTextImage(text: watermarkText, fontSize: min(width, height) * 0.035, width: width, height: height) {
        let textFilter = CIFilter(name: "CISourceOverCompositing")!
        textFilter.setValue(textImage, forKey: kCIInputImageKey)
        textFilter.setValue(ciImage, forKey: kCIInputBackgroundImageKey)

        if let outputImage = textFilter.outputImage,
           let cgImage = context.createCGImage(outputImage, from: outputImage.extent) {
          let resultImage = UIImage(cgImage: cgImage)
          if let jpegResultData = resultImage.jpegData(compressionQuality: 0.95) {
            try jpegResultData.write(to: outputUrl)
          } else {
            try imageData.write(to: outputUrl)
          }
        } else {
          try imageData.write(to: outputUrl)
        }
      } else {
        try imageData.write(to: outputUrl)
      }

      let result: [String: Any] = [
        "path": outputPath,
        "nonce": currentNonce ?? "",
        "width": Int(width),
        "height": Int(height),
        "format": "image/jpeg",
      ]
      pendingResolve?(result)
    } catch {
      pendingReject?("SAVE_ERROR", "Failed to save photo: \(error.localizedDescription)", error)
    }
    clearPending()
  }
}

// MARK: - AVCaptureFileOutputRecordingDelegate

extension NativeCameraModule: AVCaptureFileOutputRecordingDelegate {
  func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
    captureSession?.stopRunning()
    captureSession = nil

    if let error = error {
      pendingReject?("RECORDING_ERROR", "Video recording failed: \(error.localizedDescription)", error)
      clearPending()
      return
    }

    let recordedPath = outputFileURL.path
    let watermarkText = currentWatermark ?? "STYX//\(currentNonce ?? "unknown")"

    applyWatermarkToRecordedVideo(
      inputPath: recordedPath,
      watermark: watermarkText,
      resolve: pendingResolve ?? { _ in },
      reject: pendingReject ?? { _, _, _ in }
    )
    clearPending()
  }

  private func applyWatermarkToRecordedVideo(
    inputPath: String,
    watermark: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let inputUrl = URL(fileURLWithPath: inputPath)
    let asset = AVAsset(url: inputUrl)

    guard let videoTrack = asset.tracks(withMediaType: .video).first else {
      let fallbackResult: [String: Any] = [
        "path": inputPath,
        "nonce": currentNonce ?? "",
        "format": "video/mp4",
      ]
      resolve(fallbackResult)
      return
    }

    let composition = AVMutableComposition()
    guard let compositionVideoTrack = composition.addMutableTrack(
      withMediaType: .video,
      preferredTrackID: kCMPersistentTrackID_Invalid
    ) else {
      let fallbackResult: [String: Any] = [
        "path": inputPath,
        "nonce": currentNonce ?? "",
        "format": "video/mp4",
      ]
      resolve(fallbackResult)
      return
    }

    try? compositionVideoTrack.insertTimeRange(
      CMTimeRange(start: .zero, duration: asset.duration),
      of: videoTrack,
      at: .zero
    )

    if let audioTrack = asset.tracks(withMediaType: .audio).first,
       let compositionAudioTrack = composition.addMutableTrack(
        withMediaType: .audio,
        preferredTrackID: kCMPersistentTrackID_Invalid
       ) {
      try? compositionAudioTrack.insertTimeRange(
        CMTimeRange(start: .zero, duration: asset.duration),
        of: audioTrack,
        at: .zero
      )
    }

    let size = videoTrack.naturalSize
    let textLayer = createVideoWatermarkLayer(text: watermark, size: size)

    let videoLayer = CALayer()
    videoLayer.frame = CGRect(origin: .zero, size: size)
    videoLayer.addSublayer(textLayer)

    let parentLayer = CALayer()
    parentLayer.frame = CGRect(origin: .zero, size: size)
    parentLayer.addSublayer(videoLayer)

    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)

    let layerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: compositionVideoTrack)
    instruction.layerInstructions = [layerInstruction]

    let videoComposition = AVMutableVideoComposition()
    videoComposition.frameDuration = videoTrack.minFrameDuration
    videoComposition.renderSize = size
    videoComposition.animationTool = AVVideoCompositionCoreAnimationTool(
      postProcessingAsVideoLayer: videoLayer,
      in: parentLayer
    )
    videoComposition.instructions = [instruction]

    let outputUrl = URL(fileURLWithPath: inputPath.replacingOccurrences(of: ".mp4", with: "-wd.mp4"))
    try? FileManager.default.removeItem(at: outputUrl)

    guard let exportSession = AVAssetExportSession(
      asset: composition,
      presetName: AVAssetExportPresetHighestQuality
    ) else {
      let fallbackResult: [String: Any] = [
        "path": inputPath,
        "nonce": currentNonce ?? "",
        "format": "video/mp4",
      ]
      resolve(fallbackResult)
      return
    }

    exportSession.videoComposition = videoComposition
    exportSession.outputURL = outputUrl
    exportSession.outputFileType = .mp4

    exportSession.exportAsynchronously { [weak self] in
      DispatchQueue.main.async {
        let path = exportSession.status == .completed ? outputUrl.path : inputPath
        let durationMs = self?.formatDuration(asset.duration) ?? 0
        let result: [String: Any] = [
          "path": path,
          "nonce": self?.currentNonce ?? "",
          "durationMs": durationMs,
          "format": "video/mp4",
        ]
        resolve(result)
      }
    }
  }

  private func formatDuration(_ duration: CMTime) -> Int64 {
    let seconds = CMTimeGetSeconds(duration)
    return Int64(seconds * 1000)
  }

  private func clearPending() {
    pendingResolve = nil
    pendingReject = nil
    currentNonce = nil
    currentWatermark = nil
    photoOutputPath = nil
    videoOutputPath = nil
    photoOutput = nil
    videoOutput = nil
  }
}
