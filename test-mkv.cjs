const { spawn } = require("child_process");

const moviePath =
  "/Users/rusmirsadikovic/Downloads/films/L'Exorciste (1973).mkv";

console.log(`🔍 Test ffprobe sur: ${moviePath}`);

const ffprobe = spawn("ffprobe", [
  "-i",
  moviePath,
  "-show_streams",
  "-select_streams",
  "a:s",
  "-print_format",
  "json",
]);

let stdout = "";
let stderr = "";

ffprobe.stdout.on("data", (data) => {
  stdout += data.toString();
});

ffprobe.stderr.on("data", (data) => {
  stderr += data.toString();
});

ffprobe.on("close", (code) => {
  console.log(`ffprobe terminé avec code: ${code}`);

  if (code === 0) {
    try {
      const data = JSON.parse(stdout);
      console.log("Streams trouvés:", data.streams?.length || 0);

      if (data.streams) {
        data.streams.forEach((stream, index) => {
          console.log(`Stream ${index}:`, {
            type: stream.codec_type,
            language: stream.tags?.language,
            codec: stream.codec_name,
            title: stream.tags?.title,
            channels: stream.channels,
          });
        });
      }
    } catch (e) {
      console.error("Erreur parsing JSON:", e);
    }
  } else {
    console.error("Erreur ffprobe:", stderr);
  }
});

ffprobe.on("error", (error) => {
  console.error("Erreur spawn:", error);
});
