<?php
/**
 * @package Augmented Copy
 * @version 0.3
 */
/*
Plugin Name: Augmented Copy
Plugin URI: https://github.com/cgutteridge/augmented-copy
Description: Javascript to add citations and other niftiness to copied text.
Author: Christopher Gutteridge
Version: 0.3
Author URI: http://www.ecs.soton.ac.uk/people/cjg
*/

function augmented_copy_scripts()
{
    wp_register_script( 'augmented-copy-script', plugins_url( '/augmented-copy.js', __FILE__ ), array( 'jquery' ), '0.3', true );
    wp_enqueue_script( 'augmented-copy-script' );
}
add_action( 'wp_enqueue_scripts', 'augmented_copy_scripts' );
