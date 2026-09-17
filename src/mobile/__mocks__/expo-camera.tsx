import React from "react";

export const CameraView = React.forwardRef((props: any, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    recordAsync: jest
      .fn()
      .mockResolvedValue({ uri: "file:///mock/captured-video.mp4" }),
    stopRecording: jest.fn(),
    takePictureAsync: jest
      .fn()
      .mockResolvedValue({ uri: "file:///mock/captured-photo.jpg" }),
  }));
  return React.createElement("div", {
    "data-testid": "mock-camera-view",
    ...props,
  });
});

export const useCameraPermissions = () => {
  const [permission, setPermission] = React.useState({
    granted: true,
    status: "granted",
    canAskAgain: true,
  });
  const requestPermission = jest
    .fn()
    .mockResolvedValue({ granted: true, status: "granted" });
  return [permission, requestPermission] as const;
};

export const CameraType = {
  back: "back",
  front: "front",
};
