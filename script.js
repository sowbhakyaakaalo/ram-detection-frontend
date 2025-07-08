
function switchTab(tabId) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick*="${tabId}"]`).classList.add('active');
}

document.getElementById('imageInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const img = document.getElementById('uploadedImage');
  const canvas = document.getElementById('uploadCanvas');
  const ctx = canvas.getContext('2d');

  img.src = URL.createObjectURL(file);
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    // You can call your backend /predict here and draw bounding boxes
  };
});

let stream;
async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: { deviceId: document.getElementById('cameraSelect').value || undefined }
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);

    const video = document.getElementById('video');
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      drawToCanvas();
    };
  } catch (err) {
    alert("Camera access failed.");
  }
}

function drawToCanvas() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  function draw() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Here you can also call backend for detection results per frame
    requestAnimationFrame(draw);
  }
  draw();
}

async function loadCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === "videoinput");
  const select = document.getElementById('cameraSelect');
  select.innerHTML = '';
  videoDevices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `Camera ${select.length + 1}`;
    select.appendChild(option);
  });
}

window.onload = loadCameras;
