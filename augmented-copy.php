<?php
/**
 * @package Augmented Copy
 * @version 0.1
 */
/*
Plugin Name: Augmented Copy
Plugin URI: https://github.com/cgutteridge/augmented-copy
Description: Javascript to add citations and other niftiness to copied text.
Author: Christopher Gutteridge
Version: 0.1
Author URI: http://www.ecs.soton.ac.uk/people/cjg
*/

wp_register_script( 'augmented-copy-script', plugins_url( '/augmented-copy.js', __FILE__ ) );
