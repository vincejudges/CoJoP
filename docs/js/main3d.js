"use strict";
import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';


// ------------ Common ------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
const stats = new Stats();
const gui = new GUI();

const grid_helper = new THREE.GridHelper( 4, 1 );
const world_axis = new THREE.AxesHelper( 2.5 );
// ------------ Common ------------

// ------------ Controls ------------
const controls_OC = new OrbitControls( camera, renderer.domElement );
controls_OC.update();
controls_OC.addEventListener( 'change', render );

// TransformControls
const controls_TC = new TransformControls( camera, renderer.domElement );
controls_TC.addEventListener( 'change', render );
controls_TC.addEventListener( 'dragging-changed', dragging_changed );
function dragging_changed( event )
{
    controls_OC.enabled = ! event.value;
}
// ------------ Controls ------------


// ------------ Species ------------
const species_name_to_index_map =
{
    Rock: 0,
    Scissors: 1,
    Paper: 2,
};
const species_index_to_name_map = [ 'Rock', 'Scissors', 'Paper' ];
// ------------ Species ------------

// ------------ Strategies ------------
const strategies =
{
    balance_mode_chase_factor: 1,
    balance_mode_escape_factor: 2,

    chasing_mode_chase_factor: 1.6,
    chasing_mode_escape_factor: 1.1,

    escaping_mode_chase_factor: 0.5,
    escaping_mode_escape_factor: 2.5,

    chase_factor_list: null,
    escape_factor_list: null,
};
strategies.chase_factor_list = [ strategies.balance_mode_chase_factor, strategies.chasing_mode_chase_factor, strategies.escaping_mode_chase_factor ];
strategies.escape_factor_list = [ strategies.balance_mode_escape_factor, strategies.chasing_mode_escape_factor, strategies.escaping_mode_escape_factor ];
const strategy_name_to_index_map =
{
    Balance: 0,
    Chasing: 1,
    Escaping: 2,
};
const strategy_index_to_name_map = [ 'Balance', 'Chasing', 'Escaping' ];
// ------------ Strategies ------------

// ------------ Collision Mode ------------
const collision_mode_name_to_index_map =
{
    Assimilate: 0,
    Eliminate: 1,
};
const collision_mode_index_to_name_map = [ 'Assimilate', 'Eliminate' ];
// ------------ Collision Mode ------------

// ------------ Parameters ------------
const params =
{
    game_state: 0,
    dt: 0.02,
    mass: 40,
    drag_factor: 0.02,
    velocity_magnitude_limit: 0.1,
    acceleration_magnitude_limit: 0.1,
    visibility: 5,
    visibility_squared: null,
    texture_type_buffer: null,
    texture_type: 3,
    initial_camera_position: [ 2.5, 2.5, 5 ],
    reset_camera_position: null,
    number_of_species: 3,
    player_species_name: null,
    player_species_index: 0,
    player_strategy_name: null,
    strategy_list: [ 0, 0, 0 ],
    prey_list: [ 1, 2, 0 ],
    predator_list: [ 2, 0, 1 ],
    collision_mode_name: null,
    collision_mode: 0,
    collision_radius: 0.12,
    domain_x_length: 4,
    domain_y_length: 4,
    domain_z_length: 4,
    species_initial_number: 60,
    use_grid_index: false,
};
params.player_species_name = species_index_to_name_map[ params.player_species_index ];
params.player_strategy_name = strategy_index_to_name_map[ params.strategy_list[ params.player_species_index ] ];
params.collision_mode_name = collision_mode_index_to_name_map[ params.collision_mode ];
params.texture_type_buffer = params.texture_type;
params.visibility_squared = params.visibility ** 2;
params.grid_length = params.collision_radius * 10;
params.reset_camera_position = params.initial_camera_position;
change_reset_camera_position();
// ------------ Parameters ------------

// ------------ Auto Play ------------
const auto_play =
{
    status: 5,
    delay: 20,
    interval_object: null,
};
// ------------ Auto Play ------------


// ------------ Textures ------------
const colors =
{
    background_color: '#cccccc',
    point_color: [ '#0080ff', '#ff0080', '#80ff00' ],
    line_color: [ '#3333ff', '#ff3333', '#33ff33' ],
    boundary_color: '#ef4242',
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

const point_emoji_avatar_alternative_1 = [];
point_emoji_avatar_alternative_1.push( new THREE.TextureLoader().load( 'js/textures/emoji/raised_fist_light_skin_tone.png' ) );
point_emoji_avatar_alternative_1.push( new THREE.TextureLoader().load( 'js/textures/emoji/victory_hand_light_skin_tone.png' ) );
point_emoji_avatar_alternative_1.push( new THREE.TextureLoader().load( 'js/textures/emoji/hand_with_fingers_splayed_light_skin_tone.png' ) );

const point_emoji_avatar_alternative_2 = [];
point_emoji_avatar_alternative_2.push( new THREE.TextureLoader().load( 'js/textures/emoji/toilet.png' ) );
point_emoji_avatar_alternative_2.push( new THREE.TextureLoader().load( 'js/textures/emoji/pile_of_poo.png' ) );
point_emoji_avatar_alternative_2.push( new THREE.TextureLoader().load( 'js/textures/emoji/face_vomiting.png' ) );

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

const material_point_emoji_alternative_1 = [];
for ( let i = 0; i < point_emoji_avatar_alternative_1.length; ++i )
{
    material_point_emoji_alternative_1.push(
        new THREE.PointsMaterial(
        {
            color: new THREE.Color( colors.point_color[ i ] ),
            size: 0.15,
            alphaTest: 0.8,
            transparent: true,
            sizeAttenuation: true,
            map: point_emoji_avatar_alternative_1[ i ],
        } ) );
}

const material_point_emoji_alternative_2 = [];
for ( let i = 0; i < point_emoji_avatar_alternative_2.length; ++i )
{
    material_point_emoji_alternative_2.push(
        new THREE.PointsMaterial(
        {
            size: 0.15,
            alphaTest: 0.5,
            transparent: true,
            sizeAttenuation: true,
            map: point_emoji_avatar_alternative_2[ i ],
        } ) );
}


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
const material_boundary_line = new LineMaterial(
{
    color: new THREE.Color( colors.boundary_color ),
    linewidth: 0.002,
    vertexColors: false,
    dashed: false,
    alphaToCoverage: true,
    alphaTest: 0.7,
    opacity: 0.8,
} );
// ------------ Textures ------------


// ------------ Main Body ------------
const buttons =
{
    change_to_2d: function( ) { window.location.href = 'index.html'; },
    start_with_random_position: start_with_random_position,
    change_game_state: change_game_state,
    camera_reset: camera_reset,
};

const species_group = new THREE.Group();
const species_profile =
{
    boundary_indicator: null,
    species_position: [],
    species_velocity: [],
    species_instance: [],
};

let grid_indexes = [];

function update_grid_index()
{
    const grid_length = params.grid_length;
    grid_indexes = [];
    for ( let i = 0; i < species_profile.species_position.length; ++i )
    {   
        grid_indexes.push( {} );
        for ( let j = 0; j < species_profile.species_position[ i ].length; ++j )
        {
            const pos = species_profile.species_position[ i ][ j ];
            const cell_id = pos.map( element => Math.floor( element / grid_length ) );
            const cell_id_str = cell_id.toString();
            if ( ! ( cell_id_str in grid_indexes[ i ] ) )
            {
                grid_indexes[ i ][ cell_id_str ] = [];
            }
            grid_indexes[ i ][ cell_id_str ].push( j );
        }
    }
}

// function get_neighbor_points( species_index, position ) 
// {
//     const grid_length = params.collision_radius * 2;
//     const cell_id = position.map( element => Math.floor( element / grid_length ) );

//     const getCombinations = ( A ) =>
//         A.flatMap( ( ai, i ) =>
//             [ - 1, 0, 1 ].map( ( offset ) =>
//             {
//                 const combination = [ ...A ];
//                 combination[ i ] = ai + offset;
//                 return combination;
//             })
//         );
//     const neighbor_cell_ids = getCombinations( cell_id );
//     const grid_index = grid_indexes[ species_index ];
//     return neighbor_cell_ids.reduce( ( arr, key ) => arr.concat( grid_index[ key.toString() ] || [] ), [] );
// }

function get_points_within_radius( species_index, position, radius ) 
{
    const grid_length = params.grid_length;

    const cell_id = position.map( element => Math.floor( element / grid_length ) );

    const cell_number_for_radius = Math.ceil( radius / grid_length );
    const cell_id_range = [];
    for ( let i = - cell_number_for_radius; i <= cell_number_for_radius; ++i )
    {
        cell_id_range.push( i );
    }

    const getCombinations = ( A ) =>
        A.flatMap( ( ai, i ) =>
            cell_id_range.map( ( offset ) =>
            {
                const combination = [ ...A ];
                combination[ i ] = ai + offset;
                return combination;
            } )
        );
    const neighbor_cell_ids = getCombinations( cell_id );
    const grid_index = grid_indexes[ species_index ];
    const res = []
    for ( let i = 0; i < neighbor_cell_ids.length; ++i )
    {
        const key = neighbor_cell_ids[ i ].toString();
        if ( key in grid_index )
        {
            res.push( ...grid_index[ key ] );
        }
    }
    return res;
}

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
    scene.add( world_axis );
    // scene.add( grid_helper );
    scene.add( species_group );

    // Start
    draw_boundary();
    start_with_random_position();

    // Actions
    window.addEventListener( 'resize', on_window_resize );

    gui.add( buttons, 'change_to_2d' ).name( 'Change to 2D' );

    const gui_parameter_control = gui.addFolder( 'Parameters' );
    gui_parameter_control.add( buttons, 'start_with_random_position' ).name( 'Initialize' );
    gui_parameter_control.add( buttons, 'change_game_state' ).name( 'Start / Pause' );
    gui_parameter_control.add( params, 'player_strategy_name', Object.keys( strategy_name_to_index_map ) ).name( 'Player Strategy' ).listen().onChange(
        function( value )
        {
            params.strategy_list[ params.player_species_index ] = strategy_name_to_index_map[ value ];
        }
    );
    gui_parameter_control.add( params, 'player_species_name', Object.keys( species_name_to_index_map ) ).name( 'Player Controls' ).listen().onChange(
        function( value )
        {
            params.player_species_index = species_name_to_index_map[ value ];
            params.player_strategy_name = strategy_index_to_name_map[ params.strategy_list[ params.player_species_index ] ];
        }
    );
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

    const gui_hyper_control = gui_parameter_control.addFolder( 'Hyper Control' ).close();
    gui_hyper_control.add( params, 'collision_mode_name', Object.keys( collision_mode_name_to_index_map ) ).name( 'Collision Mode' ).listen().onChange(
        function ( value )
        {
            params.collision_mode = collision_mode_name_to_index_map[ value ];
        }
    );
    gui_hyper_control.add( params, 'texture_type_buffer', 0, 3, 1 ).name( 'Texture Type' ).listen().onChange( change_texture_type );
    gui_hyper_control.add( params, 'species_initial_number', 30, 5000, 10 ).name( 'Species Init #' ).listen();
    gui_hyper_control.add( params, 'mass', 10, 500, 10 ).name( 'Mass' ).listen();
    gui_hyper_control.add( params, 'drag_factor', 0.01, 0.50, 0.01 ).name( 'Drag Factor' ).listen();
    gui_hyper_control.add( params, 'collision_radius', 0.05, 0.20, 0.01 ).name( 'Collision Radius' ).listen();
    gui_hyper_control.add( params, 'velocity_magnitude_limit', 0.05, 0.5, 0.01 ).name( 'Velocity Limit' ).listen();
    gui_hyper_control.add( params, 'acceleration_magnitude_limit', 0.05, 0.5, 0.01 ).name( 'Acceleration Limit' ).listen();
    gui_hyper_control.add( params, 'domain_x_length', 0.2, 40 ).name( 'Domain x Length' ).listen().onChange( draw_boundary );
    gui_hyper_control.add( params, 'domain_y_length', 0.2, 40 ).name( 'Domain y Length' ).listen().onChange( draw_boundary );
    gui_hyper_control.add( params, 'domain_z_length', 0.2, 40 ).name( 'Domain z Length' ).listen().onChange( draw_boundary );

    const gui_enhanced_control = gui.addFolder( 'Enhanced Control' ).close();

    const gui_camera = gui_enhanced_control.addFolder( 'Camera' ).close();
    gui_camera.add( buttons, 'camera_reset' ).name( 'Reset' );
    gui_camera.add( camera.position, 'x' ).name( 'x' ).listen();
    gui_camera.add( camera.position, 'z' ).name( 'z' ).listen();
    gui_camera.add( camera.position, 'y' ).name( 'y' ).listen();

    const gui_move = gui_enhanced_control.addFolder( 'Camera Movement' ).close();
    gui_move.add( camera.position, 'x', - 5, 5 ).name( 'position.x' ).listen();
    gui_move.add( camera.position, 'z', - 5, 5 ).name( 'position.z' ).listen();
    gui_move.add( camera.position, 'y', 1, 7 ).name( 'position.y' ).listen();
    gui_move.add( camera.rotation, 'x', - Math.PI, Math.PI ).name( 'rotation.x' ).listen();
    gui_move.add( camera.rotation, 'y', - Math.PI, Math.PI ).name( 'rotation.y' ).listen();
    gui_move.add( camera.rotation, 'z', - Math.PI, Math.PI ).name( 'rotation.z' ).listen();

    THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt( 0 ) });
}

function add_points( vertices, species_type )
{
    const geometry_points = new THREE.BufferGeometry();
    geometry_points.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices.flat(), 3 ) );

    let points = [];
    if ( params.texture_type === - 1 ) points = new THREE.Points( geometry_points, material_point_emoji_alternative_2[ species_type ] );
    else if ( params.texture_type === 0 ) points = new THREE.Points( geometry_points, material_point_plain[ species_type ] );
    else if ( params.texture_type === 1 ) points = new THREE.Points( geometry_points, material_point_hand[ species_type ] );
    else if ( params.texture_type === 2 ) points = new THREE.Points( geometry_points, material_point_emoji_alternative_1[ species_type ] );
    else if ( params.texture_type === 3 ) points = new THREE.Points( geometry_points, material_point_emoji[ species_type ] );

    return points;
}

function change_reset_camera_position( )
{
    if ( window.innerWidth < window.innerHeight )
    {
        const ratio = window.innerHeight / window.innerWidth;
        params.reset_camera_position = [];
        params.reset_camera_position.push( Math.min( 7, params.initial_camera_position[ 0 ] * ratio ) );
        params.reset_camera_position.push( Math.min( 7, params.initial_camera_position[ 1 ] * ratio ) );
        params.reset_camera_position.push( Math.min( 7, params.initial_camera_position[ 2 ] * ratio ) );
    }
    else params.reset_camera_position = params.initial_camera_position;
}

function on_window_resize( )
{
    camera.aspect = window.innerWidth / window.innerHeight;;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    // change_reset_camera_position();
    // camera_reset();
}

function camera_reset( )
{
    camera.position.set( ...params.reset_camera_position );
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
            if (params.use_grid_index) update_grid_index();
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
                if (params.use_grid_index) update_grid_index(); 
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

function draw_boundary( )
{
    const x_maximum = params.domain_x_length / 2;
    const x_minimum = - x_maximum;
    const y_maximum = params.domain_y_length / 2;
    const y_minimum = - y_maximum;
    const z_maximum = params.domain_z_length / 2;
    const z_minimum = - z_maximum;
    const positions = [];
    positions.push( ...[ x_minimum, z_minimum, y_minimum ] );
    positions.push( ...[ x_maximum, z_minimum, y_minimum ] );
    positions.push( ...[ x_maximum, z_minimum, y_maximum ] );
    positions.push( ...[ x_minimum, z_minimum, y_maximum ] );
    positions.push( ...[ x_minimum, z_minimum, y_minimum ] );
    positions.push( ...[ x_minimum, z_maximum, y_minimum ] );
    positions.push( ...[ x_maximum, z_maximum, y_minimum ] );
    positions.push( ...[ x_maximum, z_minimum, y_minimum ] );
    positions.push( ...[ x_maximum, z_minimum, y_maximum ] );
    positions.push( ...[ x_maximum, z_maximum, y_maximum ] );
    positions.push( ...[ x_maximum, z_maximum, y_minimum ] );
    positions.push( ...[ x_minimum, z_maximum, y_minimum ] );
    positions.push( ...[ x_minimum, z_maximum, y_maximum ] );
    positions.push( ...[ x_minimum, z_minimum, y_maximum ] );
    positions.push( ...[ x_minimum, z_maximum, y_maximum ] );
    positions.push( ...[ x_maximum, z_maximum, y_maximum ] );
    const geometry_boundary = new LineGeometry();
    geometry_boundary.setPositions( positions );
    const boundary = new Line2( geometry_boundary, material_boundary_line );
    if ( species_profile.boundary_indicator !== null )
    {
        species_group.remove( species_profile.boundary_indicator );
        species_profile.boundary_indicator = null;
    }
    species_profile.boundary_indicator = boundary;
    species_group.add( species_profile.boundary_indicator );
}

function start_with_random_position( )
{
    species_profile.species_position = [];
    species_profile.species_velocity = [];
    params.strategy_list = [];
    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    const z_range = [ - params.domain_z_length / 2, params.domain_z_length / 2 ];
    for ( let i = 0; i < params.number_of_species; ++i )
    {
        const position = get_random_3d_points( params.species_initial_number, x_range, y_range, z_range );
        const velocity = [];
        for ( let j = 0; j < params.species_initial_number; ++j ) velocity.push( [ 0, 0, 0 ] );
        species_profile.species_position.push( position );
        species_profile.species_velocity.push( velocity );
        params.strategy_list.push( 0 );
    }

    params.player_strategy_name = strategy_index_to_name_map[ params.strategy_list[ params.player_species_index ] ];

    draw_points();
    change_game_state( 0 );
}

function add_random_noise( sigma = 0.002 )
{
    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    const z_range = [ - params.domain_z_length / 2, params.domain_z_length / 2 ];
    for ( let i = 0; i < species_profile.species_position.length; ++i )
    {
        for ( let j = 0; j < species_profile.species_position[ i ].length; ++j )
        {
            const noise = [ random_Gaussian( 0, sigma ), random_Gaussian( 0, sigma ), random_Gaussian( 0, sigma ) ];
            species_profile.species_position[ i ][ j ][ 0 ] += noise[ 0 ];
            species_profile.species_position[ i ][ j ][ 1 ] += noise[ 1 ];
            species_profile.species_position[ i ][ j ][ 2 ] += noise[ 2 ];
            // periodic boundary condition
            species_profile.species_position[ i ][ j ][ 0 ] = ( ( species_profile.species_position[ i ][ j ][ 0 ] - x_range[ 0 ] ) % params.domain_x_length + params.domain_x_length ) % params.domain_x_length + x_range[ 0 ];
            species_profile.species_position[ i ][ j ][ 1 ] = ( ( species_profile.species_position[ i ][ j ][ 1 ] - z_range[ 0 ] ) % params.domain_z_length + params.domain_z_length ) % params.domain_z_length + z_range[ 0 ];
            species_profile.species_position[ i ][ j ][ 2 ] = ( ( species_profile.species_position[ i ][ j ][ 2 ] - y_range[ 0 ] ) % params.domain_y_length + params.domain_y_length ) % params.domain_y_length + y_range[ 0 ];
        }
    }
}

function distance_squared( point_1, point_2 )
{
    let result = 0;
    for ( let i = 0; i < point_1.length; ++i ) result += ( point_1[ i ] - point_2[ i ] ) ** 2;
    return result;
}

function get_acceleration_vector( center_point, another_point_origin )
{
    let dx = 0;
    let dy = 0;
    let dz = 0;
    let another_point = another_point_origin;
    let d_squared = distance_squared( center_point, another_point_origin );

    for ( let i = - 1; i <= 1; ++i )
    {
        for ( let j = - 1; j <= 1; ++j )
        {
            for ( let k = - 1; k <= 1; ++k )
            {
                if ( i === 0 && j === 0 && k === 0 ) continue;
                const another_point_reflected = [ another_point_origin[ 0 ] + i * params.domain_x_length, another_point_origin[ 1 ] + k * params.domain_z_length, another_point_origin[ 2 ] + j * params.domain_y_length ];
                const d_squared_reflected = distance_squared( center_point, another_point_reflected );
                if ( d_squared_reflected < d_squared )
                {
                    d_squared = d_squared_reflected;
                    another_point = another_point_reflected;
                }
            }
        }
    }
    if ( d_squared < params.visibility_squared )
    {
        const d = Math.sqrt( d_squared );
        dx = ( another_point[ 0 ] - center_point[ 0 ] ) / ( d * d_squared );
        dz = ( another_point[ 1 ] - center_point[ 1 ] ) / ( d * d_squared );
        dy = ( another_point[ 2 ] - center_point[ 2 ] ) / ( d * d_squared );
    }
    return [ dx, dz, dy ];
}

function get_velocity_update( species_index )
{
    const acceleration_times_dt = [];
    const acceleration_limit = params.acceleration_magnitude_limit / params.dt;
    const acceleration_limit_squared = acceleration_limit ** 2;
    const strategy_index = params.strategy_list[ species_index ];
    const chase_factor = strategies.chase_factor_list[ strategy_index ];
    const escape_factor = strategies.escape_factor_list[ strategy_index ];
    const prey_index = params.prey_list[ species_index ];
    const predator_index = params.predator_list[ species_index ];
    for ( let i = 0; i < species_profile.species_position[ species_index ].length; ++i )
    {
        const species_point = species_profile.species_position[ species_index ][ i ];
        let chase_dx = 0;
        let chase_dy = 0;
        let chase_dz = 0;
        let escape_dx = 0;
        let escape_dy = 0;
        let escape_dz = 0;

        for ( let j = 0; j < species_profile.species_position[ prey_index ].length; ++j )
        {
            const prey_point_origin = species_profile.species_position[ prey_index ][ j ];
            const update_vector = get_acceleration_vector( species_point, prey_point_origin );
            chase_dx += update_vector[ 0 ];
            chase_dy += update_vector[ 2 ];
            chase_dz += update_vector[ 1 ];
        }
        chase_dx *= chase_factor / params.mass;
        chase_dy *= chase_factor / params.mass;
        chase_dz *= chase_factor / params.mass;

        for ( let j = 0; j < species_profile.species_position[ predator_index ].length; ++j )
        {
            const predator_point_origin = species_profile.species_position[ predator_index ][ j ];
            const update_vector = get_acceleration_vector( species_point, predator_point_origin );
            escape_dx += update_vector[ 0 ];
            escape_dy += update_vector[ 2 ];
            escape_dz += update_vector[ 1 ];
        }
        escape_dx *= escape_factor / params.mass;
        escape_dy *= escape_factor / params.mass;
        escape_dz *= escape_factor / params.mass;

        let dx = chase_dx - escape_dx;
        let dy = chase_dy - escape_dy;
        let dz = chase_dz - escape_dz;
        const a_squared = dx ** 2 + dy ** 2 + dz ** 2;
        if ( a_squared > acceleration_limit_squared )
        {
            const a = Math.sqrt( a_squared );
            dx *= acceleration_limit / a;
            dy *= acceleration_limit / a;
            dz *= acceleration_limit / a;
        }
        acceleration_times_dt.push( [ dx * params.dt, dz * params.dt, dy * params.dt ] );
    }

    return acceleration_times_dt;
}

function get_velocity_update_grid_index( species_index )
{
    const acceleration_times_dt = [];
    const acceleration_limit = params.acceleration_magnitude_limit / params.dt;
    const acceleration_limit_squared = acceleration_limit ** 2;
    const strategy_index = params.strategy_list[ species_index ];
    const chase_factor = strategies.chase_factor_list[ strategy_index ];
    const escape_factor = strategies.escape_factor_list[ strategy_index ];
    const prey_index = params.prey_list[ species_index ];
    const predator_index = params.predator_list[ species_index ];
    for ( let i = 0; i < species_profile.species_position[ species_index ].length; ++i )
    {
        const species_point = species_profile.species_position[ species_index ][ i ];
        let chase_dx = 0;
        let chase_dy = 0;
        let escape_dx = 0;
        let escape_dy = 0;

        const preys = get_points_within_radius( prey_index, species_point, params.visibility );
        for ( let j = 0; j < preys.length; ++j )
        {
            const prey_point_origin = species_profile.species_position[ prey_index ][ preys[ j ] ];
            const update_vector = get_acceleration_vector( species_point, prey_point_origin );
            chase_dx += update_vector[ 0 ];
            chase_dy += update_vector[ 2 ];
        }
        chase_dx *= chase_factor / params.mass;
        chase_dy *= chase_factor / params.mass;

        const predators = get_points_within_radius( predator_index, species_point, params.visibility );
        for ( let j = 0; j < predators.length; ++j )
        {
            const predator_point_origin = species_profile.species_position[ predator_index ][ predators[ j ] ];
            const update_vector = get_acceleration_vector( species_point, predator_point_origin );
            escape_dx += update_vector[ 0 ];
            escape_dy += update_vector[ 2 ];
        }
        escape_dx *= escape_factor / params.mass;
        escape_dy *= escape_factor / params.mass;

        let dx = chase_dx - escape_dx;
        let dy = chase_dy - escape_dy;
        const a_squared = dx ** 2 + dy ** 2;
        if ( a_squared > acceleration_limit_squared )
        {
            const a = Math.sqrt( a_squared );
            dx *= acceleration_limit / a;
            dy *= acceleration_limit / a;
        }
        acceleration_times_dt.push( [ dx * params.dt, 0, dy * params.dt ] );
    }

    return acceleration_times_dt;
}

function update_species_position( )
{
    const x_range = [ - params.domain_x_length / 2, params.domain_x_length / 2 ];
    const y_range = [ - params.domain_y_length / 2, params.domain_y_length / 2 ];
    const z_range = [ - params.domain_z_length / 2, params.domain_z_length / 2 ];
    const velocity_limit = params.velocity_magnitude_limit / params.dt;
    const velocity_limit_squared = velocity_limit ** 2;
    for ( let i = 0; i < params.number_of_species; ++i )
    {
        const velocity_update = params.use_grid_index ? get_velocity_update_grid_index( i ) : get_velocity_update( i );
        for ( let j = 0; j < species_profile.species_position[ i ].length; ++j )
        {
            // resistance: point tends to become stationary
            species_profile.species_velocity[ i ][ j ][ 0 ] *= 1 - params.drag_factor;
            species_profile.species_velocity[ i ][ j ][ 1 ] *= 1 - params.drag_factor;
            species_profile.species_velocity[ i ][ j ][ 2 ] *= 1 - params.drag_factor;
            // velocity is changed according to the force
            species_profile.species_velocity[ i ][ j ][ 0 ] += velocity_update[ j ][ 0 ];
            species_profile.species_velocity[ i ][ j ][ 1 ] += velocity_update[ j ][ 1 ];
            species_profile.species_velocity[ i ][ j ][ 2 ] += velocity_update[ j ][ 2 ];
            // velocity has a bound
            const v_squared = species_profile.species_velocity[ i ][ j ][ 0 ] ** 2 + species_profile.species_velocity[ i ][ j ][ 1 ] ** 2 + species_profile.species_velocity[ i ][ j ][ 2 ] ** 2;
            if ( v_squared > velocity_limit_squared )
            {
                const v = Math.sqrt( v_squared );
                species_profile.species_velocity[ i ][ j ][ 0 ] *= velocity_limit / v;
                species_profile.species_velocity[ i ][ j ][ 1 ] *= velocity_limit / v;
                species_profile.species_velocity[ i ][ j ][ 2 ] *= velocity_limit / v;
            }
            // position is changed according to the velocity
            species_profile.species_position[ i ][ j ][ 0 ] += species_profile.species_velocity[ i ][ j ][ 0 ] * params.dt;
            species_profile.species_position[ i ][ j ][ 1 ] += species_profile.species_velocity[ i ][ j ][ 1 ] * params.dt;
            species_profile.species_position[ i ][ j ][ 2 ] += species_profile.species_velocity[ i ][ j ][ 2 ] * params.dt;
            // periodic boundary condition
            species_profile.species_position[ i ][ j ][ 0 ] = ( ( species_profile.species_position[ i ][ j ][ 0 ] - x_range[ 0 ] ) % params.domain_x_length + params.domain_x_length ) % params.domain_x_length + x_range[ 0 ];
            species_profile.species_position[ i ][ j ][ 1 ] = ( ( species_profile.species_position[ i ][ j ][ 1 ] - z_range[ 0 ] ) % params.domain_z_length + params.domain_z_length ) % params.domain_z_length + z_range[ 0 ];
            species_profile.species_position[ i ][ j ][ 2 ] = ( ( species_profile.species_position[ i ][ j ][ 2 ] - y_range[ 0 ] ) % params.domain_y_length + params.domain_y_length ) % params.domain_y_length + y_range[ 0 ];
        }
    }
}

function get_species_collision_update_grid_index_version( species_index )
{
    const prey_index = params.prey_list[ species_index ];
    const predator_index = params.predator_list[ species_index ];
    const collision_radius_squared = params.collision_radius ** 2;

    const new_species_position = [];
    const new_species_velocity = [];
    for ( let i = 0; i < species_profile.species_position[ species_index ].length; ++i )
    {
        const species_point = species_profile.species_position[ species_index ][ i ];
        let exist_flag = true;

        const neighbor_predators = get_points_within_radius( predator_index, species_point, params.collision_radius );
        for ( let j = 0; j < neighbor_predators.length; ++j )
        {
            const predator_point = species_profile.species_position[ predator_index ][ neighbor_predators[ j ] ];
            const d_squared = distance_squared( species_point, predator_point );
            if ( d_squared < collision_radius_squared )
            {
                exist_flag = false;
                break;
            }
        }
        if ( exist_flag )
        {
            new_species_position.push( species_point );
            new_species_velocity.push( species_profile.species_velocity[ species_index ][ i ] );
        }
    }

    if ( params.collision_mode === 0 )
    {
        for ( let j = 0; j < species_profile.species_position[ prey_index ].length; ++j )
        {
            const prey_point = species_profile.species_position[ prey_index ][ j ];
            let vanish_flag = false;

            const neighbor_species = get_points_within_radius( species_index, prey_point, params.collision_radius );
            for ( let i = 0; i < neighbor_species.length; ++i )
            {
                const species_point = species_profile.species_position[ species_index ][ neighbor_species[ i ] ];
                const d_squared = distance_squared( species_point, prey_point );
                if ( d_squared < collision_radius_squared )
                {
                    vanish_flag = true;
                    break;
                }
            }
            if ( vanish_flag )
            {
                new_species_position.push( prey_point );
                new_species_velocity.push( species_profile.species_velocity[ prey_index ][ j ] );
            }
        }
    }
    return [ new_species_position, new_species_velocity ];
}

function get_species_collision_update( species_index )
{
    const prey_index = params.prey_list[ species_index ];
    const predator_index = params.predator_list[ species_index ];
    const collision_radius_squared = params.collision_radius ** 2;

    const new_species_position = [];
    const new_species_velocity = [];
    for ( let i = 0; i < species_profile.species_position[ species_index ].length; ++i )
    {
        const species_point = species_profile.species_position[ species_index ][ i ];
        let exist_flag = true;
        for ( let j = 0; j < species_profile.species_position[ predator_index ].length; ++j )
        {
            const predator_point = species_profile.species_position[ predator_index ][ j ];
            const d_squared = distance_squared( species_point, predator_point );
            if ( d_squared < collision_radius_squared )
            {
                exist_flag = false;
                break;
            }
        }
        if ( exist_flag )
        {
            new_species_position.push( species_point );
            new_species_velocity.push( species_profile.species_velocity[ species_index ][ i ] );
        }
    }

    if ( params.collision_mode === 0 )
    {
        for ( let j = 0; j < species_profile.species_position[ prey_index ].length; ++j )
        {
            const prey_point = species_profile.species_position[ prey_index ][ j ];
            let vanish_flag = false;
            for ( let i = 0; i < species_profile.species_position[ species_index ].length; ++i )
            {
                const species_point = species_profile.species_position[ species_index ][ i ];
                const d_squared = distance_squared( species_point, prey_point );
                if ( d_squared < collision_radius_squared )
                {
                    vanish_flag = true;
                    break;
                }
            }
            if ( vanish_flag )
            {
                new_species_position.push( prey_point );
                new_species_velocity.push( species_profile.species_velocity[ prey_index ][ j ] );
            }
        }
    }

    return [ new_species_position, new_species_velocity ];
}

function update_species_collision( )
{
    const new_species_position = [];
    const new_species_velocity = [];
    for ( let i = 0; i < params.number_of_species; ++i )
    {
        const update = params.use_grid_index ? get_species_collision_update_grid_index_version( i ) : get_species_collision_update( i );
        new_species_position.push( update[ 0 ] );
        new_species_velocity.push( update[ 1 ] );
    }
    species_profile.species_position = new_species_position;
    species_profile.species_velocity = new_species_velocity;
}

function next_step( )
{
    // add_random_noise();
    const time_list = [];
    time_list.push( performance.now() );
    if ( params.use_grid_index ) update_grid_index();
    time_list.push( performance.now() );
    update_species_position();
    time_list.push( performance.now() );

    if ( params.use_grid_index ) update_grid_index();
    time_list.push( performance.now() );
    update_species_collision();
    time_list.push( performance.now() );

    draw_points();
    time_list.push( performance.now() );

    const total_time = time_list[ time_list.length - 1 ] - time_list[ 0 ];
    console.log( time_list.map( ( element, index, arr ) =>
    {
        if ( index === 0 ) return null;
        return ( ( element - arr[ index - 1 ] ) / total_time * 100 ).toString() + '%';
    } ).filter( ( element ) => element !== null ) );
    console.log( total_time );
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
// ------------ Main Body ------------
