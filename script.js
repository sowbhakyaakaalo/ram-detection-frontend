// script.js

const API_URL = "https://onnx-api-backend-7.onrender.com/predict/";
const video = document.getElementById("videoPreview");
const canvas = document.getElementById("canvasPreview");
const ctx = canvas.getContext("2d");
let stream = null;
let lastResultImage = null;
let frameCount = 0;

// Handle tab switching
function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  document.querySelector(`.tab[onclick*='${tabId}']`).classList.add("active");
}

// Upload handler
const imageUpload = document.getElementById("imageUpload");
imageUpload.addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API_URL, { method: "POST", body: formData });
    const arrayBuffer = await res.arrayBuffer();
    const imgBlob = new Blob([arrayBuffer], { type: "image/jpeg" });
    const imgURL = URL.createObjectURL(imgBlob);

    const img = new Image();
    img.src = imgURL;
    img.onload = () => {
      const uploadCanvas = document.getElementById("uploadCanvas");
      const uploadCtx = uploadCanvas.getContext("2d");
      uploadCanvas.width = img.width;
      uploadCanvas.height = img.height;
      uploadCtx.clearRect(0, 0, uploadCanvas.width, uploadCanvas.height);
      uploadCtx.drawImage(img, 0, 0, img.width, img.height);
      URL.revokeObjectURL(imgURL);
    };
  } catch (err) {
    console.warn("Upload error", err);
  }
});

// Camera handler
const startCameraBtn = document.getElementById("startCamera");
startCameraBtn.addEventListener("click", async () => {
  const facingMode = document.getElementById("cameraSelect").value;
  if (stream) stream.getTracks().forEach(track => track.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 }
    }
  });

  video.srcObject = stream;
  video.style.display = "block";
  video.onloadedmetadata = () => {
    video.play();
    requestAnimationFrame(processCameraFrame);
  };
});

async function processCameraFrame() {
  if (video.readyState === 4) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    frameCount++;
    if (frameCount % 5 === 0) {
      const frame = canvas.toDataURL("image/jpeg");
      const blob = await (await fetch(frame)).blob();
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const res = await fetch(API_URL, { method: "POST", body: formData });
        const arrayBuffer = await res.arrayBuffer();
        const imgBlob = new Blob([arrayBuffer], { type: "image/jpeg" });
        const imgURL = URL.createObjectURL(imgBlob);

        const tempImg = new Image();
        tempImg.src = imgURL;
        tempImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
          lastResultImage = tempImg;
          URL.revokeObjectURL(imgURL);
        };
      } catch (err) {
        console.warn("Detection error", err);
      }
    } else if (lastResultImage) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(lastResultImage, 0, 0, canvas.width, canvas.height);
    }
  }

  setTimeout(() => requestAnimationFrame(processCameraFrame), 100);
}

