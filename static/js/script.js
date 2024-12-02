const video4 = document.getElementsByClassName('input_video4')[0];
const out4 = document.getElementsByClassName('output4')[0];
const canvasCtx4 = out4.getContext('2d');
const displaytext = document.getElementById('displaytext');
const emotionText = document.querySelector('.emotion-text');
let emotion = '';
let drawMode = true;
let predictionStarted = false;
let predict;

document.addEventListener('keydown',(event)=>{
  if(event.key === 'Escape'){
    const stream = video4.srcObject;
    clearInterval(predict)

  if (stream) {
    const tracks = stream.getTracks(); // Get all tracks (video/audio)
    tracks.forEach((track) => track.stop()); // Stop each track
  }

  video4.srcObject = null; 
  canvasCtx4.clearRect(0, 0, out4.width, out4.height);
  }
});

function removeElements(landmarks, elements) {
  for (const element of elements) {
    delete landmarks[element];
  }
}

function removeLandmarks(results) {
  if (results.poseLandmarks) {
    removeElements(
        results.poseLandmarks,
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]);
  }
}

function connect(ctx, connectors) {
  const canvas = ctx.canvas;
  for (const connector of connectors) {
    const from = connector[0];
    const to = connector[1];
    if (from && to) {
      if (from.visibility && to.visibility &&
          (from.visibility < 0.1 || to.visibility < 0.1)) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
      ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
      ctx.stroke();
    }
  }
}

let result = [0];
function onResultsHolistic(results) {
  document.body.classList.add('loaded');
  removeLandmarks(results);

  if (drawMode==false)
    return;

  canvasCtx4.save();
  canvasCtx4.clearRect(0, 0, out4.width, out4.height);
  canvasCtx4.drawImage(
      results.image, 0, 0, out4.width, out4.height);
  canvasCtx4.lineWidth = 5;
  if (results.poseLandmarks) {
    if (results.rightHandLandmarks) {
      canvasCtx4.strokeStyle = '#00FF00';
      connect(canvasCtx4, [[
                results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW],
                results.rightHandLandmarks[0]
              ]]);
    }
      if (results.leftHandLandmarks) {
        canvasCtx4.strokeStyle = '#FF0000';
        connect(canvasCtx4, [[
                  results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
                  results.leftHandLandmarks[0]
                ]]);
    }
  }
  drawConnectors(
      canvasCtx4, results.poseLandmarks, POSE_CONNECTIONS,
      {color: '#00FF00'});
  drawLandmarks(
      canvasCtx4, results.poseLandmarks,
      {color: '#00FF00', fillColor: '#FF0000'});
  drawConnectors(
      canvasCtx4, results.rightHandLandmarks, HAND_CONNECTIONS,
      {color: '#00CC00'});
  drawLandmarks(
      canvasCtx4, results.rightHandLandmarks, {
        color: '#00FF00',
        fillColor: '#FF0000',
        lineWidth: 2,
        radius: (data) => {
          return lerp(data.from.z, -0.15, .1, 10, 1);
        }
      });
  drawConnectors(
      canvasCtx4, results.leftHandLandmarks, HAND_CONNECTIONS,
      {color: '#CC0000'});
  drawLandmarks(
      canvasCtx4, results.leftHandLandmarks, {
        color: '#FF0000',
        fillColor: '#00FF00',
        lineWidth: 2,
        radius: (data) => {
          return lerp(data.from.z, -0.15, .1, 10, 1);
        }
      });
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_TESSELATION,
      {color: '#C0C0C070', lineWidth: 1});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_RIGHT_EYE,
      {color: '#FF3030'});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
      {color: '#FF3030'});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_LEFT_EYE,
      {color: '#30FF30'});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
      {color: '#30FF30'});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_FACE_OVAL,
      {color: '#E0E0E0'});
  drawConnectors(
      canvasCtx4, results.faceLandmarks, FACEMESH_LIPS,
      {color: '#E0E0E0'});

  canvasCtx4.restore();
  result= results;
  startPrediction();
}

const holistic = new Holistic({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.1/${file}`;
}});
holistic.onResults(onResultsHolistic);

const camera = new Camera(video4, {
  onFrame: async () => {
    await holistic.send({image: video4});
  },
  width: 480,
  height: 480
});

//

async function extractLandmarks(results) {
    lst = []
    if (results.faceLandmarks) {
        for (const i of results.faceLandmarks) {
          lst.push(i.x - results.faceLandmarks[1].x);
          lst.push(i.y - results.faceLandmarks[1].y);
        }
      
        if (results.leftHandLandmarks) {
          for (const i of results.leftHandLandmarks) {
            lst.push(i.x - results.leftHandLandmarks[8].x);
            lst.push(i.y - results.leftHandLandmarks[8].y);
          }
        } else {
          for (let i = 0; i < 42; i++) {
            lst.push(0.0);
          }
        }
      
        if (results.rightHandLandmarks) {
          for (const i of results.rightHandLandmarks) {
            lst.push(i.x - results.rightHandLandmarks[8].x);
            lst.push(i.y - results.rightHandLandmarks[8].y);
          }
        } else {
          for (let i = 0; i < 42; i++) {
            lst.push(0.0);
          }
        }
      }
      
    return lst;
  }
  
  async function sendLandmarks() {
    // Extract landmarks
    const r = await extractLandmarks(result);
    if (r.length != 0){
      const payload = {
        landmarks: r,
      };
    
      // Send POST request to the server
      try {
        const response = await fetch('/emotion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
    
        // Optional: Handle response
        const data = await response.json();
        emotion = data.emotion;
      } catch (error) {
        console.error('Error sending landmarks:', error);
      }
    }

  }

  function startPrediction(){
    if(predictionStarted == false){
      predictionStarted = true;
       predict = setInterval(function(){sendLandmarks(); emotionText.innerText = emotion; document.querySelector('.predict-button').setAttribute('data-emotion', emotion);}, 100);
    }
  }
