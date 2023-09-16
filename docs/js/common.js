function read_text_file( file_name )
{
    const raw_file = new XMLHttpRequest();
    var all_text;
    raw_file.open( 'GET', file_name, false );
    raw_file.onreadystatechange = function ()
    {
        if ( raw_file.readyState === 4 )
        {
            if ( raw_file.status === 200 || raw_file.status === 0 )
            {
                all_text = raw_file.responseText;
            }
        }
    }
    raw_file.send( null );
    return all_text;
}

function remove_all_spaces( s )
{
    return s.replace( /[^\S\r\n]+/g, '' );
}

function get_random_2d_points( number_of_points, x_range, y_range )
{
    const points = [];
    const x_length = x_range[ 1 ] - x_range[ 0 ];
    const y_length = y_range[ 1 ] - y_range[ 0 ];

    for ( let i = 0; i < number_of_points; ++i )
    {
        const x = Math.random() * x_length + x_range[ 0 ];
        const y = Math.random() * y_length + y_range[ 0 ];
        points.push( [ x, 0, y ] );
    }
    return points;
}
