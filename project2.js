var SCREEN_WIDTH = window.innerWidth - 25;
var SCREEN_HEIGHT = window.innerHeight - 25;

var camera, scene;
var canvasRenderer, webglRenderer;

var container, mesh, geometry, plane;

var controls;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var spotLight = new THREE.SpotLight( 0xffffff );

var balls = [];


init();
update();

function init() {

    container = document.createElement('div');
    document.body.appendChild(container);
    
    
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 1200;
    camera.position.y = 1000;
    camera.lookAt({
        x: 0,
        y: 0,
        z: 0
    });
    
    controls = new THREE.OrbitControls(camera);
    controls.addEventListener( 'change', render );
    
    scene = new THREE.Scene();
    
    //balls
    //var geom = new THREE.SphereGeometry(30, 20, 12);
    for (var i = 0; i < 15; i++) {
        var radius = Math.random()* 30 + 10;
        var geom = new THREE.SphereGeometry(radius, 32, 32);
        var ball = {};
        ball.obj = new THREE.Mesh( 
            geom, 
            new THREE.MeshPhongMaterial( {
                color: Math.floor(Math.random() * 0x1000000),
                specular:0x333333,
                shininess: 100
            })
        );
        ball.obj.castShadow = true;
        
        ball.x = 230*Math.random() + 150;   // set random ball position
        ball.y = 230*Math.random() + 200;
        ball.z = 200*Math.random() + 150;
        ball.dx = Math.random() * 5 + 1;  // set random ball velocity, in units per second
        ball.dy = Math.random() * 5 + 1;
        ball.dz = Math.random() * 5 + 1;
        ball.mass = Math.random()* 20 + 3;
        ball.r = radius;
        
        if (Math.random() < 0.5)
            ball.dx = -ball.dx;
        if (Math.random() < 0.5)
            ball.dy = -ball.dy;
        if (Math.random() < 0.5)
            ball.dz = -ball.dz;
        ball.obj.position.set( ball.x, ball.y, ball.z);
        scene.add(ball.obj);
        balls.push(ball);
    }

//---------------static------------------------//
    //ground
    var groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x6C6C6C
    });
    ground_plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 0, 0), groundMaterial);
    ground_plane.rotation.x = -Math.PI / 2;
    
    ground_plane.position.set(0, 0, 0);
    ground_plane.receiveShadow = true;
    
    scene.add(ground_plane);
    
    // walls
    var planeGeo = new THREE.PlaneBufferGeometry( 1000.1, 1000.1 );
    var planeTop = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
    planeTop.position.y = 1000;
    planeTop.rotateX( Math.PI / 2 );
    
    planeTop.receiveShadow = true;
    //collidableMeshList.push(planeTop);
    scene.add( planeTop );

    var planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xffffff } ) );
    planeBack.position.z = -500;
    planeBack.position.y = 500;
    
    planeBack.receiveShadow = true;
    //collidableMeshList.push(planeBack);
    scene.add( planeBack );

    var planeFront = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x7f7fff } ) );
    planeFront.position.z = 500;
    planeFront.position.y = 500;
    planeFront.rotateY( Math.PI );
    
    planeFront.receiveShadow = true;
    //collidableMeshList.push(planeFront);
    scene.add( planeFront );

    var planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0x00ff00 } ) );
    planeRight.position.x = 500;
    planeRight.position.y = 500;
    planeRight.rotateY( - Math.PI / 2 );
    
    planeRight.receiveShadow = true;
    //collidableMeshList.push(planeRight);
    scene.add( planeRight );

    var planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial( { color: 0xff0000 } ) );
    planeLeft.position.x = -500;
    planeLeft.position.y = 500;
    planeLeft.rotateY( Math.PI / 2 );
    
    planeLeft.receiveShadow = true;
    //collidableMeshList.push(planeLeft);
    scene.add( planeLeft );
    
    // wall lights
    var mainLight = new THREE.PointLight( 0xcccccc, 1.5, 250 );
    mainLight.position.y = 500;
    scene.add( mainLight );

    var greenLight = new THREE.PointLight( 0x00ff00, 1.25, 1000 );
    greenLight.position.set( 550, 500, 0 );
    scene.add( greenLight );

    var redLight = new THREE.PointLight( 0xff0000, 1.25, 1000 );
    redLight.position.set( -550, 500, 0 );
    scene.add( redLight );

    var blueLight = new THREE.PointLight( 0x7f7fff, 1.25, 1000 );
    blueLight.position.set( 0, 500, 550 );
    scene.add( blueLight );
    
    //spot light
    spotLight.position.set( 100, 1900, 0 );

    spotLight.castShadow = true;
    spotLight.shadowCameraVisible = false;

    spotLight.shadowMapWidth = 2048;
    spotLight.shadowMapHeight = 2048;

    spotLight.shadowCameraNear = 100;
    spotLight.shadowCameraFar = 2000;
    spotLight.shadowCameraFov = 30;
  
    //spotLight.shadowCameraVisible = true;

    scene.add( spotLight );

    // RENDERER Config
    webglRenderer = new THREE.WebGLRenderer();
    webglRenderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    //webglRenderer.domElement.style.position = "relative";
    webglRenderer.shadowMapEnabled = true;
    webglRenderer.shadowMapSoft = true;

    container.appendChild(webglRenderer.domElement);
}

function update() {

    requestAnimationFrame(update);
    //bouncing detection
    for (var i = 0; i < balls.length; i++) 
    {
       var ball = balls[i];
       
       /* update ball position based on ball velocity and elapsed time */
       ball.x += ball.dx;
       ball.y += ball.dy;
       ball.z += ball.dz;
       
       /* if ball has moved outside the cube, reflect it back into the cube */
       if (ball.x > 500 - ball.r || ball.x < ball.r - 500) 
       {
           ball.dx = -ball.dx;
       }
       if (ball.y > 1010 - ball.r || ball.y < ball.r + 10) 
       {
           ball.dy = -ball.dy;
       }
       if (ball.z > 500 - ball.r || ball.z < ball.r - 500) {
           ball.dz = -ball.dz;
       }
       
       //after bouncing speed 
       for (var j = 0; j < balls.length; j++)
       {
           var ball2 = balls[j];
           var distance = Math.sqrt(Math.pow((ball.x - ball2.x), 2) + Math.pow((ball.y - ball2.y), 2) 
            + Math.pow((ball.z - ball2.z), 2));
            
           if (distance < ball.r + ball2.r && distance !== 0)
           {
                console.log("hit");
                var new_dx1 = (ball.dx * (ball.mass - ball2.mass) + (2 * ball2.mass * ball2.dx)) / (ball.mass + ball2.mass);
                var new_dy1 = (ball.dy * (ball.mass - ball2.mass) + (2 * ball2.mass * ball2.dy)) / (ball.mass + ball2.mass);
                var new_dz1 = (ball.dz * (ball.mass - ball2.mass) + (2 * ball2.mass * ball2.dz)) / (ball.mass + ball2.mass);

                //console.log(ball.dx);

                var new_dx2 = (ball2.dx * (ball2.mass - ball.mass) + (2 * ball.mass * ball.dx)) / (ball.mass + ball2.mass);
                var new_dy2 = (ball2.dy * (ball2.mass - ball.mass) + (2 * ball.mass * ball.dy)) / (ball.mass + ball2.mass);
                var new_dz2 = (ball2.dz * (ball2.mass - ball.mass) + (2 * ball.mass * ball.dz)) / (ball.mass + ball2.mass);


                //console.log(dx2[0]);
                ball.x += new_dx1;
                ball.y += new_dy1;
                ball.z += new_dz1;

                ball2.x += new_dx2;
                ball2.y += new_dy2;
                ball2.z += new_dz2;

                ball.dx = new_dx1;
                ball.dy = new_dy1;
                ball.dz = new_dz1;


                ball2.dx = new_dx2;
                ball2.dy = new_dy2;
                ball2.dz = new_dz2;
           }
       }
       
       ball.obj.position.set(ball.x, ball.y, ball.z);
   }
    
    controls.update();
    render();
}

function render() {
    camera.lookAt(scene.position);
    webglRenderer.render(scene, camera);
}



