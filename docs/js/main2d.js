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
    species_position: [],
    species_instance: [],
};

const sprite = new THREE.TextureLoader().load( 'js/textures/sprites/disc.png' );

const point_hand_avatar = [];
point_hand_avatar.push( new THREE.TextureLoader().load( 'js/textures/hand/rock.png' ) );
point_hand_avatar.push( new THREE.TextureLoader().load( 'js/textures/hand/scissors.png' ) );
point_hand_avatar.push( new THREE.TextureLoader().load( 'js/textures/hand/paper.png' ) );

const point_emoji_avatar = [];
point_emoji_avatar.push( new THREE.TextureLoader().load( 'js/textures/emoji/rock.png' ) );
point_emoji_avatar.push( new THREE.TextureLoader().load( 'js/textures/emoji/scissors.png' ) );
point_emoji_avatar.push( new THREE.TextureLoader().load( 'js/textures/emoji/scroll.png' ) );

// const points = [];
// const points_profile = [];

const material_point_plain = [];
for ( let i = 0; i < colors.point_color.length; ++i )
{
    material_point_plain.push(
        new THREE.PointsMaterial(
        {
            color: new THREE.Color( colors.point_color[ i ] ),
            size: 0.10,
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true,
            map: sprite,
        } ) );
}

const material_point_hand = [];
for ( let i = 0; i < point_hand_avatar.length; ++i )
{
    material_point_hand.push(
        new THREE.PointsMaterial(
        {
            color: new THREE.Color( colors.point_color[ i ] ),
            size: 0.20,
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true,
            map: point_hand_avatar[ i ],
        } ) );
}

const material_point_emoji = [];
for ( let i = 0; i < point_emoji_avatar.length; ++i )
{
    material_point_emoji.push(
        new THREE.PointsMaterial(
        {
            size: 0.15,
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true,
            map: point_emoji_avatar[ i ],
        } ) );
}

// const lines = [];
// const lines_profile = [];

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

const auto_play =
{
    status: 3,
    delay: 100,
    interval_object: null
};

const params =
{
    game_state: 0,
    texture_type_buffer: 2,
    texture_type: 2,
    initial_camera_height: 3,
    number_of_species: 3,
    domain_x_length: 4,
    domain_y_length: 4,
    species_initial_number: 60,
};

const buttons =
{
    start_with_random_position: start_with_random_position,
    change_game_state: change_game_state,
    camera_reset: camera_reset,
};

initialization();
animate();
start_with_random_position();

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
    gui_parameter_control.add( buttons, 'start_with_random_position' ).name( 'Initialize' );
    gui_parameter_control.add( buttons, 'change_game_state' ).name( 'Start / Pause' );
    gui_parameter_control.add( params, 'texture_type_buffer', 0, 2, 1 ).name( 'Texture' ).listen().onChange( change_texture_type );
    gui_parameter_control.add( auto_play, 'status', 1, 6, 1 ).name( 'Game Speed' ).listen().onChange(
        function( value )
        {
            let new_delay = auto_play.delay;
            if ( value === 1 ) new_delay = 500;
            else if ( value === 2 ) new_delay = 200;
            else if ( value === 3 ) new_delay = 100;
            else if ( value === 4 ) new_delay = 50;
            else if ( value === 5 ) new_delay = 20;
            else if ( value === 6 ) new_delay = 10;
            change_auto_play_speed( new_delay );
        }
    );
    gui_parameter_control.add( params, 'species_initial_number', 30, 500, 10 ).name( 'Species Init #' ).listen();
    gui_parameter_control.add( params, 'domain_x_length', 0.2, 4 ).name( 'Domain x Length' ).listen();
    gui_parameter_control.add( params, 'domain_y_length', 0.2, 4 ).name( 'Domain y Length' ).listen();

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

    let points = [];
    if ( params.texture_type === 0 ) points = new THREE.Points( geometry_points, material_point_plain[ species_type ] );
    else if ( params.texture_type === 1 ) points = new THREE.Points( geometry_points, material_point_hand[ species_type ] );
    else if ( params.texture_type === 2 ) points = new THREE.Points( geometry_points, material_point_emoji[ species_type ] );

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

function change_texture_type( new_texture_type )
{
    if ( params.texture_type !== new_texture_type )
    {
        params.texture_type = new_texture_type;
        draw_points();
    }
}

function change_auto_play_speed( new_delay )
{
    if ( auto_play.delay !== new_delay )
    {
        auto_play.delay = new_delay;
        if ( auto_play.interval_object !== null )
        {
            clearInterval( auto_play.interval_object );
            auto_play.interval_object = setInterval( next_step, auto_play.delay );
        }
    }
}

function change_game_state( force_state = null )
{
    if ( force_state === null )
    {
        if ( auto_play.interval_object !== null )
        {
            clearInterval( auto_play.interval_object );
            auto_play.interval_object = null;
        }
        if ( params.game_state === 0 )
        {
            // change to start
            params.game_state = 1;
            auto_play.interval_object = setInterval( next_step, auto_play.delay );
        }
        else if ( params.game_state === 1 )
        {
            // change to pause
            params.game_state = 0;
        }
    }
    else
    {
        if ( params.game_state !== force_state )
        {
            params.game_state = force_state;
            if ( auto_play.interval_object !== null )
            {
                clearInterval( auto_play.interval_object );
                auto_play.interval_object = null;
            }
            if ( params.game_state === 1 )
            {
                auto_play.interval_object = setInterval( next_step, auto_play.delay );
            }
        }
    }
}

function draw_points( )
{
    if ( species_profile.species_instance.length !== 0 )
    {
        for ( let i = 0; i < species_profile.species_instance.length; ++i )
        {
            species_group.remove( species_profile.species_instance[ i ] );
        }
        species_profile.species_instance = [];
    }

    for ( let i = 0; i < species_profile.species_position.length; ++i )
    {
        species_profile.species_instance.push( add_points( species_profile.species_position[ i ], i ) );
        species_group.add( species_profile.species_instance[ i ] );
    }
}

function start_with_random_position( )
{
    species_profile.species_position = [];
    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    for ( let i = 0; i < params.number_of_species; ++i )
    {
        const points = get_random_2d_points( params.species_initial_number, x_range, y_range );
        species_profile.species_position.push( points );
    }

    draw_points();
    change_game_state( 0 );
}

function add_random_noise( sigma = 0.02 )
{
    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    for ( let i = 0; i < species_profile.species_position.length; ++i )
    {
        for ( let j = 0; j < species_profile.species_position[ i ].length; ++j )
        {
            const noise = [ random_Gaussian( 0, sigma ), 0, random_Gaussian( 0, sigma ) ];
            species_profile.species_position[ i ][ j ][ 0 ] += noise[ 0 ];
            species_profile.species_position[ i ][ j ][ 2 ] += noise[ 2 ];
            species_profile.species_position[ i ][ j ][ 0 ] = ( ( species_profile.species_position[ i ][ j ][ 0 ] - x_range[ 0 ] ) % params.domain_x_length + params.domain_x_length ) % params.domain_x_length + x_range[ 0 ];
            species_profile.species_position[ i ][ j ][ 2 ] = ( ( species_profile.species_position[ i ][ j ][ 2 ] - y_range[ 0 ] ) % params.domain_y_length + params.domain_y_length ) % params.domain_y_length + y_range[ 0 ];
        }
    }
}

function next_step( )
{
    add_random_noise();
    draw_points();
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
