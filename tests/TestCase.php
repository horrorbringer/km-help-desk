<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Creates the application.
     * Ensures SQLite in-memory database is used for tests.
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        
        // Force SQLite in-memory database for tests
        // This ensures phpunit.xml settings are respected
        config(['database.connections.sqlite.database' => ':memory:']);
        config(['database.default' => 'sqlite']);
        
        return $app;
    }
}
