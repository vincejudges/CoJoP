"use strict";
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
const stats = new Stats();
const gui = new GUI();
const point_cloud = new THREE.Group();

const grid_helper = new THREE.GridHelper( 4, 64 );;
const world_axis = new THREE.AxesHelper( 2.5 );

const colors =
{
    background_color: '#cccccc',
    point_color: [ '#0080ff', '#ff0080', '#80ff00' ],
    line_color: [ '#3333ff', '#ff3333', '#33ff33' ],
}

const species_group = new THREE.Group();
const species_profile =
{
    species_instance: [],
};

const sprite = new THREE.TextureLoader().load( 'js/textures/sprites/disc.png' );

const points = [];
const points_profile = [];

const material_point = [];
for ( let i = 0; i < colors.point_color.length; ++i )
{
    material_point.push(
        new THREE.PointsMaterial(
        {
            color: new THREE.Color( colors.point_color[ i ] ),
            size: 0.07,
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true,
            map: sprite,
        } ) );
}

const lines = [];
const lines_profile = [];

const material_line = [];
for ( let i = 0; i < colors.line_color.length; ++i )
{   
    material_line.push(
        new LineMaterial(
        {
            color: new THREE.Color( colors.line_color[ i ] ),
            linewidth: 0.003,
            vertexColors: false,
            dashed: false,
            alphaToCoverage: true,
            alphaTest: 0.7,
            opacity: 0.8,
        } ) );
}

const params =
{
    initial_camera_height: 3,
    number_of_species: 3,
    domain_x_length: 4,
    domain_y_length: 4,
    species_initial_number: 60,
};

const buttons =
{
    camera_reset: camera_reset,
    random_initialization: random_initialization,
};

initialization();
animate();

function initialization( )
{
    // Scene
    scene.background = new THREE.Color( colors.background_color );
    scene.fog = new THREE.FogExp2( colors.background_color, 0.002 );
    
    // Camera
    camera_reset();

    // Renderer
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Stats
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.zIndex = 100;
    stats.domElement.style.bottom = '0px';
    document.body.appendChild( stats.domElement );

    // Objects
    // scene.add( world_axis );
    scene.add( grid_helper );
    scene.add( species_group );

    // Actions
    window.addEventListener( 'resize', on_window_resize );

    const gui_parameter_control = gui.addFolder( 'Parameters' );
    gui_parameter_control.add( buttons, 'random_initialization' ).name( 'Initialize' );
    gui_parameter_control.add( params, 'domain_x_length', 0.2, 4 ).name( 'domain x length' ).listen();
    gui_parameter_control.add( params, 'domain_y_length', 0.2, 4 ).name( 'domain y length' ).listen();
    gui_parameter_control.add( params, 'species_initial_number', 30, 500, 10 ).name( 'species init #' ).listen();

    const gui_enhanced_control = gui.addFolder( 'Enhanced Control' ).close();

    const gui_camera = gui_enhanced_control.addFolder( 'Camera' ).close();
    gui_camera.add( buttons, 'camera_reset' ).name( 'Reset' );
    gui_camera.add( camera.position, 'x' ).name( 'x' ).listen();
    gui_camera.add( camera.position, 'z' ).name( 'z' ).listen();
    gui_camera.add( camera.position, 'y' ).name( 'y' ).listen();

    const gui_move = gui_enhanced_control.addFolder( 'Camera Movement' ).close();
    gui_move.add( camera.position, 'x', - 5, 5 ).name( 'position.x' ).listen();
    gui_move.add( camera.position, 'z', - 5, 5 ).name( 'position.z' ).listen();
    gui_move.add( camera.position, 'y', - 5, 5 ).name( 'position.y' ).listen();
    gui_move.add( camera.rotation, 'x', - Math.PI, Math.PI ).name( 'rotation.x' ).listen();
    gui_move.add( camera.rotation, 'y', - Math.PI, Math.PI ).name( 'rotation.y' ).listen();
    gui_move.add( camera.rotation, 'z', - Math.PI, Math.PI ).name( 'rotation.z' ).listen();

    THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
}

function add_points( vertices, species_type )
{
    const geometry_points = new THREE.BufferGeometry();
    geometry_points.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices.flat(), 3 ) );

    const points = new THREE.Points( geometry_points, material_point[ species_type ] );
    return points;
}

function on_window_resize( )
{
    camera.aspect = window.innerWidth / window.innerHeight;;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function camera_reset( )
{
    camera.position.set( 0, params.initial_camera_height, 0 );
    camera.lookAt( 0, 0, 0 );
}

function random_initialization( )
{
    if ( species_profile.species_instance.length !== 0 )
    {
        for ( let i = 0; i < species_profile.species_instance.length; ++i )
        {
            species_group.remove( species_profile.species_instance[ i ] );
        }
        species_profile.species_instance = [];
    }

    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    console.log( x_range, y_range );
    for ( let i = 0; i < params.number_of_species; ++i )
    {
        const points = get_random_2d_points( params.species_initial_number, x_range, y_range );
        species_profile.species_instance.push( add_points( points, i ) );
        species_group.add( species_profile.species_instance[ i ] );
    }
}

function render( )
{
    renderer.render( scene, camera );
}

function animate( )
{
    requestAnimationFrame( animate );

    stats.update();

    render();
}
