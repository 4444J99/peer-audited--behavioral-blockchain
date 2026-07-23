import { Injectable, Logger } from "@nestjs/common";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  bitrate: number;
  size: number;
}

export interface TranscodeResult {
  transcodedBuffer: Buffer;
  thumbnailBuffer: Buffer;
  metadata: VideoMetadata;
}

/**
 * TranscodingService — FFmpeg-based video transcoding for proof media.
 *
 * Transcodes proof videos to H.264/AAC for universal playback,
 * generates a thumbnail at the midpoint, and extracts metadata.
 * All processing happens in temp directories that are cleaned up after.
 */
@Injectable()
export class TranscodingService {
  private readonly logger = new Logger(TranscodingService.name);

  /**
   * Transcodes a video buffer to H.264/AAC MP4 and generates a thumbnail.
   * Input must be a valid video file buffer.
   */
  async transcode(inputBuffer: Buffer, sourceContentType: string): Promise<TranscodeResult> {
    const tmpDir = await mkdtemp(join(tmpdir(), "styx-transcode-"));
    const ext = this.getExtension(sourceContentType);
    const inputPath = join(tmpDir, `input.${ext}`);
    const outputPath = join(tmpDir, "output.mp4");
    const thumbnailPath = join(tmpDir, "thumbnail.jpg");

    try {
      await writeFile(inputPath, inputBuffer);

      // 1. Extract metadata
      const metadata = await this.extractMetadata(inputPath);

      // 2. Transcode to H.264/AAC MP4
      // -c:v libx264: H.264 video codec
      // -preset fast: balance speed/quality
      // -crf 23: reasonable quality (lower = better, 23 is default)
      // -c:a aac: AAC audio codec
      // -b:a 128k: audio bitrate
      // -movflags +faststart: enable streaming before full download
      await execFileAsync("ffmpeg", [
        "-y", "-i", inputPath,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        "-max_muxing_queue_size", "1024",
        outputPath,
      ], { timeout: 120_000 });

      // 3. Generate thumbnail at midpoint
      const seekTime = Math.max(0, metadata.duration / 2);
      await execFileAsync("ffmpeg", [
        "-y", "-ss", String(seekTime), "-i", inputPath,
        "-vframes", "1", "-vf", "scale=640:-1",
        "-q:v", "2",
        thumbnailPath,
      ], { timeout: 30_000 });

      const [transcodedBuffer, thumbnailBuffer] = await Promise.all([
        readFile(outputPath),
        readFile(thumbnailPath),
      ]);

      return { transcodedBuffer, thumbnailBuffer, metadata };
    } finally {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Extracts video metadata using ffprobe.
   */
  async extractMetadata(filePath: string): Promise<VideoMetadata> {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ], { timeout: 10_000 });

    const probe = JSON.parse(stdout);
    const videoStream = probe.streams?.find(
      (s: any) => s.codec_type === "video",
    );

    return {
      duration: parseFloat(probe.format?.duration || "0"),
      width: parseInt(videoStream?.width || "0", 10),
      height: parseInt(videoStream?.height || "0", 10),
      codec: videoStream?.codec_name || "unknown",
      fps: this.parseFps(videoStream?.r_frame_rate || "0/1"),
      bitrate: parseInt(probe.format?.bit_rate || "0", 10),
      size: parseInt(probe.format?.size || "0", 10),
    };
  }

  /**
   * Validates that a buffer contains a decodable video.
   * Returns true if FFmpeg can read the input without errors.
   */
  async validateVideo(inputBuffer: Buffer, contentType: string): Promise<boolean> {
    const tmpDir = await mkdtemp(join(tmpdir(), "styx-validate-"));
    const ext = this.getExtension(contentType);
    const inputPath = join(tmpDir, `input.${ext}`);

    try {
      await writeFile(inputPath, inputBuffer);
      await execFileAsync("ffprobe", [
        "-v", "error",
        "-show_entries", "format=format_name",
        "-of", "csv=p=0",
        inputPath,
      ], { timeout: 10_000 });
      return true;
    } catch {
      return false;
    } finally {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  private getExtension(contentType: string): string {
    const map: Record<string, string> = {
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
      "video/x-msvideo": "avi",
      "video/x-matroska": "mkv",
    };
    return map[contentType] || "mp4";
  }

  private parseFps(frameRate: string): number {
    const [num, den] = frameRate.split("/").map(Number);
    if (!den || den === 0) return 0;
    return Math.round((num / den) * 100) / 100;
  }
}

async function writeFile(path: string, data: Buffer): Promise<void> {
  const { writeFile: wf } = await import("fs/promises");
  await wf(path, data);
}
