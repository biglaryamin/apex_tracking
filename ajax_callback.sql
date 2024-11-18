BEGIN
    -- Clear any previous output
    htp.init;

    -- Set the correct content type to JSON
    owa_util.mime_header('application/json', FALSE);
    owa_util.http_header_close;

    -- Open JSON object
    apex_json.open_object;
    apex_json.write('success', true);
    apex_json.write('message', 'Bus location paths retrieved successfully.');

    -- Open JSON array for bus paths
    apex_json.open_array('bus_paths');

    -- Query distinct bus IDs
    FOR bus IN (SELECT DISTINCT BUS_ID FROM bus_locations)
    LOOP
        -- Open JSON object for each bus path
        apex_json.open_object;
        apex_json.write('bus_id', bus.BUS_ID);

        -- Generate the URL for this bus ID
        apex_json.write(
            'url',
            apex_util.prepare_url(
                'f?p=54304:16:' || :APP_SESSION || '::::P16_BUS_ID:' || bus.BUS_ID
            )
        );

        -- Open JSON array for the bus's coordinates
        apex_json.open_array('path');

        -- Fetch all coordinates for the current bus ID, ordered by timestamp
        FOR location IN (SELECT LATITUDE, LONGITUDE, TIMESTAMP, IS_LAST_STATUS
                         FROM bus_locations
                         WHERE BUS_ID = bus.BUS_ID
                         ORDER BY TIMESTAMP)
        LOOP
            -- Open JSON object for each location
            apex_json.open_object;
            apex_json.write('latitude', location.LATITUDE);
            apex_json.write('longitude', location.LONGITUDE);
            apex_json.write('timestamp', TO_CHAR(location.TIMESTAMP, 'YYYY-MM-DD"T"HH24:MI:SS'));
            apex_json.write('is_last_status', location.IS_LAST_STATUS);
            apex_json.close_object;
        END LOOP;

        -- Close the coordinates array and bus path object
        apex_json.close_array;
        apex_json.close_object;
    END LOOP;

    -- Close the JSON array and root object
    apex_json.close_array;
    apex_json.close_object;
END;
