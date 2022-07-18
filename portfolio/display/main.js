
'use strict';

import * as TWEEN from './tween.js';
import * as THREE from './three/three.module.js';

import { GUI } from './three/libs/lil-gui.module.min.js';
import { Sky } from './three/objects/Sky.js';
import { OrbitControls } from './three/controls/OrbitControls.js';
import { FBXLoader } from './three/loaders/FBXLoader.js';

import Stats from './three/libs/stats.module.js';


import {Responsive} from './responsive.js';
import {GrassBackground} from './render/grass.js';


const CAMERA_START_POSITION = {
  x: 0,
  y: 3,
  z: 70,
};
export class CinematicBackground {
  constructor(CINEMATIC_ANIMATION = false) {

    const create_path = (sub_path) => `${
      window.location.origin
    }/portfolio/display/${
      sub_path
    }`;

    //Grass scene
    var scene = new THREE.Scene();
    //Sky scene
    var backgroundScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('#bg'),
    });


    function init() {

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.autoClear = false;
      camera.position.set(
        CAMERA_START_POSITION.x,
        CAMERA_START_POSITION.y,
        CAMERA_START_POSITION.z,
      );

      function add_lighting() {

        const pointLight = new THREE.PointLight(0xFFA487);
        pointLight.position.set( 0, 200, 0 );
        // (380, 150, 50);

        const ambientLight = new THREE.AmbientLight(0xFFA487);

        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        hemiLight.position.set( 0, 200, 0 );


        scene.add( ambientLight);
        scene.add(pointLight);

        // const lightHelper = new THREE.PointLightHelper(pointLight);
        // const gridHelper = new THREE.GridHelper(200, 50);
        // scene.add(gridHelper);

      }

      function add_sky() {
        function addStar() {
          const geometry = new THREE.SphereGeometry(0.25, 24, 24);
          const material = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
          });
          const star = new THREE.Mesh(geometry, material);

          const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));

          star.position.set(x, y, z);
          backgroundScene.add(star);

        }

        // stars

        const radius = 10;

				const starsGeometry = [ new THREE.BufferGeometry(), new THREE.BufferGeometry() ];

				const vertices1 = [];
				const vertices2 = [];

				const vertex = new THREE.Vector3();

				for ( let i = 0; i < 250; i ++ ) {

					vertex.x = Math.random() * 2 - 1;
					vertex.y = Math.random() * 2 - 1;
					vertex.z = Math.random() * 1;
					vertex.multiplyScalar( radius );

					vertices1.push( vertex.x, vertex.y, vertex.z );

				}

				for ( let i = 0; i < 1500; i ++ ) {

					vertex.x = Math.random() * 2 - 1;
					vertex.y = Math.random() * 2 - 1;
					vertex.z = Math.random() * 1;
					vertex.multiplyScalar( radius );

					vertices2.push( vertex.x, vertex.y, vertex.z );

				}

				starsGeometry[ 0 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices1, 3 ) );
				starsGeometry[ 1 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices2, 3 ) );

				const starsMaterials = [
					new THREE.PointsMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
					new THREE.PointsMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
					new THREE.PointsMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
					new THREE.PointsMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
					new THREE.PointsMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
					new THREE.PointsMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
				];

				for ( let i = 10; i < 30; i ++ ) {

					const stars = new THREE.Points( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

					stars.rotation.x = Math.random() * 6;
					stars.rotation.y = Math.random() * 6;
					stars.rotation.z = Math.random() * 6;
					stars.scale.setScalar( i * 10 );

					stars.matrixAutoUpdate = false;
					stars.updateMatrix();

					backgroundScene.add( stars );

				}
      }

			function initSky() {

        let sky, sun;

				// Add Sky
				sky = new Sky();
				sky.scale.setScalar( 450000 );
				backgroundScene.add( sky );

				sun = new THREE.Vector3();

				/// GUI

				const effectController = {
					turbidity: 1.6,
					rayleigh: 3.803,
					mieCoefficient: 0.007,
					mieDirectionalG: 0.779,
					elevation: 1.5,
					azimuth: 153.5,
					exposure: renderer.toneMappingExposure
				};

				function guiChanged() {

					const uniforms = sky.material.uniforms;
					uniforms[ 'turbidity' ].value = effectController.turbidity;
					uniforms[ 'rayleigh' ].value = effectController.rayleigh;
					uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
					uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

					const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
					const theta = THREE.MathUtils.degToRad( effectController.azimuth );

					sun.setFromSphericalCoords( 1, phi, theta );

					uniforms[ 'sunPosition' ].value.copy( sun );

					renderer.toneMappingExposure = effectController.exposure;
					renderer.render( backgroundScene, camera );

				}

				// const gui = new GUI();
        //
				// gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
				// gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
				// gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

				guiChanged();

			}

      function add_flat_ground() {
        // ground

  			const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x009900, depthWrite: false } ) );
  			mesh.rotation.x = - Math.PI / 2;
  			mesh.receiveShadow = true;
  			scene.add( mesh );

  			// const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
  			// grid.material.opacity = 0.2;
  			// grid.material.transparent = true;
  			// scene.add( grid );

        // world

  			const geometry = new THREE.CylinderGeometry( 0, 10, 30, 4, 1 );
  			const material = new THREE.MeshPhongMaterial( { color: 0x00ff00, flatShading: true } );

        const loader = new FBXLoader();
  			for ( let i = 0; i < 0; i ++ ) {

    			loader.load( create_path(`models/grass/fbx/Grass${
            Math.floor(Math.random() * 13) + 1
          }.fbx`), function ( object ) {

            object.position.set(
              Math.random() * 1600 - 800,
              0,
              Math.random() * 1600 - 800,
            );

    				object.traverse( function ( child ) {

    					if ( child.isMesh ) {

                if (child.isMesh) {
                  child.material.color.set(0x56FF41);
                }

    						child.castShadow = true;
    						child.receiveShadow = true;

    					}

    				} );

    				scene.add( object );

    			} );

  				// const mesh = new THREE.Mesh( geometry, material );
  				// mesh.position.x = Math.random() * 1600 - 800;
  				// mesh.position.y = 0;
  				// mesh.position.z = Math.random() * 1600 - 800;
  				// mesh.updateMatrix();
  				// mesh.matrixAutoUpdate = false;
  				// scene.add( mesh );

  			}

      }
      function add_world() {
        new GrassBackground(camera, backgroundScene);
      }

      function add_models() {


        const moonTexture = new THREE.TextureLoader().load(create_path('images/moon.jpg'));
        const normalTexture = new THREE.TextureLoader().load(create_path('images/normal.jpg'));

        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(10, 32, 32),
          new THREE.MeshStandardMaterial({
            map: moonTexture,
            normalMap: normalTexture,
          }),
        );

        moon.position.set(-120, 40, -40);

        scene.add(moon);

        const loader = new FBXLoader();
  			loader.load( create_path('models/low-poly-mill.fbx'), function ( object ) {

  				// let mixer = new THREE.AnimationMixer( object );

  				// const action = mixer.clipAction( object.animations[ 0 ] );
  				// action.play();

          object.position.set(100, -30, -300);
          object.rotation.set(0, Math.PI / 12, 0);

  				object.traverse( function ( child ) {

  					if ( child.isMesh ) {

  						child.castShadow = true;
  						child.receiveShadow = true;

  					}

  				} );

  				scene.add( object );

  			} );

      }

      add_lighting();
      // add_sky();
      initSky();
      add_world();
      add_models();

    }

    function start_story() {

      const STORY_ELEMENTS = [
        'INTRO',
        'DEVELOPMENT',
        'RISING ACTION',
        'CONFLICT',
        'FALLING ACTION',
        'RESOLUTION',
      ];
      const CAMERA_GAP_SCALE = 100;
      const WORLD_SCALE = 20;
      const CAMERA_VELOCITY = {
        x: -.002,
        y: +.002,
        z: -.02,
      };



      const ANIMATION_TIME = 4000;
      let last_t = 0;
      let _scroll_state_valid = true;
      let last_seen_book;
      function slideCamera(x, y, z) {

        allow_scroll(false);

        const [starting_x, starting_y, starting_z] = [
          camera.position.x,
          camera.position.y,
          camera.position.z,
        ];

        new TWEEN.TWEEN.Tween( { x: starting_x, y: starting_y, z: starting_z, } )
          .to( { x: x, y: y, z: z, }, ANIMATION_TIME )
          .easing( TWEEN.TWEEN.Easing.Quadratic.InOut )
          .onUpdate( function () {
            camera.position.x = this.x;
            camera.position.y = this.y;
            camera.position.z = this.z;
          } )
          .onComplete(allow_scroll)
          .start();
      }
      function moveCamera() {
        if (!_scroll_state_valid) return;

        const t = -document.body.getBoundingClientRect().top;

        if (CINEMATIC_ANIMATION) {

          const books = document.querySelectorAll('.book-section');

          let seen_book, seen_book_index;

          if (last_seen_book == null) {
            seen_book = books[0];
            seen_book_index = 0;
          }
          else {
            books.forEach((book, index) => {
              if (seen_book != null) return;

              if (book.getBoundingClientRect().top < window.innerHeight + 40) {
                if (book.getBoundingClientRect().bottom > 200) {
                  seen_book = book;
                  seen_book_index = index;
                }
              }
            });
          }

          if (seen_book == null || last_seen_book == seen_book) return;

          last_seen_book = seen_book;
          window.scroll(0, seen_book.offsetTop - window.innerHeight + 280);

          const [z, x, y] = [
            CAMERA_START_POSITION.z + CAMERA_VELOCITY.z * CAMERA_GAP_SCALE * WORLD_SCALE * seen_book_index,
            CAMERA_START_POSITION.x + CAMERA_VELOCITY.x * CAMERA_GAP_SCALE * WORLD_SCALE * seen_book_index,
            CAMERA_START_POSITION.y + CAMERA_VELOCITY.y * CAMERA_GAP_SCALE * WORLD_SCALE * seen_book_index,
          ];

          slideCamera(x, y, z);
        }
        else {
          camera.position.z = CAMERA_START_POSITION.z + t * CAMERA_VELOCITY.z / 10;
          camera.position.x = CAMERA_START_POSITION.x + t * CAMERA_VELOCITY.x / 10;
          camera.position.y = CAMERA_START_POSITION.y + t * CAMERA_VELOCITY.y / 10;
        }
      }
      moveCamera();

      document.body.onscroll = moveCamera;

      document.querySelector('html').style.overflowX = 'hidden';
      function allow_scroll(state = true) {
        _scroll_state_valid = state;

        document.querySelector('html').style.overflowY = state ? 'scroll' : 'hidden';
      }

      return moveCamera;

    }

    function animate(time) {
      requestAnimationFrame(animate);

      TWEEN.TWEEN.update(time);

    	renderer.clear();
      renderer.render(backgroundScene, camera);
      renderer.render(scene, camera);
    }

    init();
    this.update_camera = start_story();
    animate();

  }
}
