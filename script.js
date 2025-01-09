var noise = new SimplexNoise();

var vizInit = function () {
  let file = document.getElementById("thefile");
  let audio = document.getElementById("audio");
  let fileLabel = document.querySelector("label.file");
  let volumeControl = document.getElementById("volumeControl");
  const timeline = document.getElementById("timeline");
  const currentTimeDisplay = document.getElementById("currentTime");
  const totalTimeDisplay = document.getElementById("totalTime");
  const audioControl = document.getElementById("audioControl");

  document.onload = function (e) {
    console.log(e);
    audio.play();
    play();
  };
  file.onchange = function () {
    fileLabel.classList.add("normal");
    audio.classList.add("active");
    var files = this.files;
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    play();
  };

  // Captura de audio del micrófono
  let mediaRecorder;
  let audioChunks = [];
  document.body.appendChild(audio); // Agrega el elemento al DOM
  const startBtn = document.getElementById("start-btn");
  const statusEl = document.getElementById("status");

  // Solicita acceso al micrófono
  function initializeMediaRecorder(){
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
  
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
  
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          fileLabel.classList.add("normal");
          audio.classList.add("active");
          audio.src = audioUrl;
          audio.load();
          audio.play();
          play();
          // Reinicia los chunks para la próxima grabación
          audioChunks = [];
        };
      })
      .catch((error) => {
        console.error("Error al acceder al micrófono:", error);
        statusEl.textContent = "No se pudo acceder al micrófono.";
      });
  }

  // Cambio de icono dependiendo si el audio esta en play.
  function setPauseIcon() {
    audioControl.innerHTML = `
    <svg id="pauseButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" height="60" width="60">
      <path clip-rule="evenodd"
        d="M21.6 12a9.6 9.6 0 1 1-19.2 0 9.6 9.6 0 0 1 19.2 0ZM8.4 9.6a1.2 1.2 0 1 1 2.4 0v4.8a1.2 1.2 0 1 1-2.4 0V9.6Zm6-1.2a1.2 1.2 0 0 0-1.2 1.2v4.8a1.2 1.2 0 1 0 2.4 0V9.6a1.2 1.2 0 0 0-1.2-1.2Z"
        fill-rule="evenodd"></path>
    </svg>`;
  }
  function setPlayIcon() {
    console.log("setPlayIcon");
    audioControl.innerHTML = `
    <svg id="playButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" height="60" width="60">
      <path clip-rule="evenodd"
        d="M21.6 12a9.6 9.6 0 1 1-19.2 0 9.6 9.6 0 0 1 19.2 0ZM9 8.4l6 3.6-6 3.6V8.4Z"
        fill-rule="evenodd"></path>
    </svg>`;
  }

  // ******** MANEJO DE EVENTOS ******
  // Actualiza el tiempo total cuando se cargue el audio
  audio.addEventListener("loadedmetadata", () => {
    const totalMinutes = Math.floor(audio.duration / 60);
    const totalSeconds = Math.floor(audio.duration % 60)
      .toString()
      .padStart(2, "0");
    totalTimeDisplay.textContent = `${totalMinutes}:${totalSeconds}`;
    timeline.max = Math.floor(audio.duration); // Establece el rango máximo del control deslizante
  });

  // Actualiza la línea de tiempo y el tiempo actual
  audio.addEventListener("timeupdate", () => {
    timeline.value = Math.floor(audio.currentTime);

    const currentMinutes = Math.floor(audio.currentTime / 60);
    const currentSeconds = Math.floor(audio.currentTime % 60)
      .toString()
      .padStart(2, "0");
    currentTimeDisplay.textContent = `${currentMinutes}:${currentSeconds}`;
  });

  timeline.addEventListener("input", (event) => {
    audio.currentTime = event.target.value;
  });

  audio.addEventListener("timeupdate", () => {
    const remainingTime = audio.duration - audio.currentTime;
    const remainingMinutes = Math.floor(remainingTime / 60);
    const remainingSeconds = Math.floor(remainingTime % 60)
      .toString()
      .padStart(2, "0");
  });

  volumeControl.addEventListener("input", (event) => {
    audio.volume = event.target.value;
  });

  audioControl.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      setPauseIcon();
    } else {
      audio.pause();
      setPlayIcon();
    }
  });

  startBtn.addEventListener("click", async () => {
    if (!mediaRecorder) {
      statusEl.textContent = "No se pudo acceder al micrófono.";
      await initializeMediaRecorder();
    }

    if(mediaRecorder){
      mediaRecorder.start();
      statusEl.textContent = "Grabando...";

      setTimeout(() => {
        mediaRecorder.stop();
        statusEl.textContent = "Grabación detenida.";
      }, 5000);
    }
  });

  function play() {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    var planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: 0x6904ce,
      side: THREE.DoubleSide,
      wireframe: true,
    });

    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(0, 30, 0);
    group.add(plane);

    var plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set(0, -30, 0);
    group.add(plane2);

    var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
      color: 0xff00ee,
      wireframe: true,
    });

    var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);

    scene.add(group);

    document.getElementById("out").appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize, false);

    render();

    function render() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, dataArray.length / 2 - 1);
      var upperHalfArray = dataArray.slice(
        dataArray.length / 2 - 1,
        dataArray.length - 1
      );

      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;

      makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
      makeRoughGround(plane2, modulate(lowerMaxFr, 0, 1, 0.5, 4));

      makeRoughBall(
        ball,
        modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
        modulate(upperAvgFr, 0, 1, 0, 4)
      );

      group.rotation.y += 0.005;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var amp = 7;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance =
          offset +
          bassFr +
          noise.noise3D(
            vertex.x + time * rf * 7,
            vertex.y + time * rf * 8,
            vertex.z + time * rf * 9
          ) *
            amp *
            treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    function makeRoughGround(mesh, distortionFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var amp = 2;
        var time = Date.now();
        var distance =
          (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) +
            0) *
          distortionFr *
          amp;
        vertex.z = distance;
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    audio.play();
  }
};

document.addEventListener("DOMContentLoaded", vizInit);

document.body.addEventListener("touchend", function (ev) {
  context.resume();
});

function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + fr * delta;
}

function avg(arr) {
  var total = arr.reduce(function (sum, b) {
    return sum + b;
  });
  return total / arr.length;
}

function max(arr) {
  return arr.reduce(function (a, b) {
    return Math.max(a, b);
  });
}
