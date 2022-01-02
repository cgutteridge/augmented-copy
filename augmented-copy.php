<?php
/**
 * @package Augmented Copy
 * @version 0.5
 */
/*
Plugin Name: Augmented Copy
Plugin URI: https://github.com/cgutteridge/augmented-copy
Description: Javascript to add citations and other niftiness to copied text.
Author: Christopher Gutteridge
Version: 0.5
Author URI: http://www.ecs.soton.ac.uk/people/cjg
*/

function augmented_copy_scripts()
{
    wp_register_script( 'augmented-copy-script', plugins_url( '/augmented-copy.js', __FILE__ ), array( 'jquery' ), '0.4', true );
    wp_enqueue_script( 'augmented-copy-script' );
}
add_action( 'wp_enqueue_scripts', 'augmented_copy_scripts' );

add_filter( 'the_content', 'augmented_copy_filter_the_content_in_the_main_loop', 1 );
function augmented_copy_filter_the_content_in_the_main_loop( $content ) {
 
    // Check if we're inside the main loop in a single Post.
    if ( is_singular() && in_the_loop() && is_main_query() ) {
        $meta = get_post();
        $author = get_the_author_meta("display_name");
        $author_url = get_the_author_meta("user_url");
        $options = get_option( 'augmented_copy_options' );

        $metabox = "";
        $metabox .= "<div class='augmented_copy_metadata' style='display:none'>\n";
        $metabox .= "<div class='published'>".esc_html__($meta->post_date)."</div>\n";
        $metabox .= "<div class='title'>".esc_html__($meta->post_title)."</div>\n";
        $metabox .= "<div class='guid'>".esc_html__($meta->guid)."</div>\n";
        $metabox .= "<div class='author'>".esc_html__($author)."</div>\n";
        $metabox .= "<div class='author_url'>".esc_html__($author_url)."</div>\n";
        $metabox .= "</div>\n";
       
        $metabox .= "<script>";
        $metabox .= "var augmented_copy_options = ".json_encode($options);
        $metabox .= "</script>\n"; 
        return $content . $metabox;
    }
 
    return $content;
}
 
function augmented_copy_options() {
    return [
        "hires" => "Copy Hires URL",
        "citation" => "Copy Citation", 
        "vmcitation" => "Copy Visual-Meta Citation", 
        "bibtex" => "Copy BibTeX", 
        "twitter" => "Tweet", 
        "facebook" => "Facebook", 
        "google" => "Google", 
        "about" => "About",
        "flash" => "Show popup confirmation messages"
    ];
}

function augmented_copy_settings_api_init() {

     add_settings_section(
        'augmented_copy_setting_section',
        'Augmented Copy',
        function() { },
        'reading'
    );

    add_settings_field(
        'augmented_copy_options',
        'Augmented Copy Options',
        'augmented_copy_options_field',
        'reading',
        'augmented_copy_setting_section'
    );

    $options_list = augmented_copy_options();

    $defaults = augmented_copy_options_default();
    register_setting( 'reading', 'augmented_copy_options', [ 'type'=>'array', 'default'=>$defaults ] );
     
} // augmented_copy_settings_api_init()

function augmented_copy_options_default() {
    $options_list = augmented_copy_options();
    return array_keys($options_list);
}

function augmented_copy_options_field() {
    $options_list = augmented_copy_options();

    $options = get_option( 'augmented_copy_options' );

    foreach( $options_list as $key=>$label ) {
        print "<label><input type='checkbox' name='augmented_copy_options[]' ";
        checked( in_array( $key, $options ), 1 );
        print " value='$key'>$label</label> &nbsp; ";
    }
} 
add_action( 'admin_init', 'augmented_copy_settings_api_init' );
