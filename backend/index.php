<?php

/**
 * MindSpeak - Laravel Front Controller for Hostinger
 * Modified to work with Hostinger's directory structure
 */

// Path to the Laravel application
define('LARAVEL_START', microtime(true));

// Register the auto-loader
require __DIR__.'/vendor/autoload.php';

// Get the Laravel application instance
$app = require_once __DIR__.'/bootstrap/app.php';

// Set the public path to the current directory
$app->bind('path.public', function() {
    return __DIR__;
});

// Run the application
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response); 