<?php

namespace ProContent;

use Illuminate\Support\ServiceProvider;

class ProContentServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/../config/procontent.php', 'procontent');
        $this->app->singleton('procontent', function () {
            return new Editor(config('procontent'));
        });
    }

    public function boot()
    {
        $this->publishes([
            __DIR__.'/../config/procontent.php' => config_path('procontent.php'),
        ]);

        $this->publishes([
            __DIR__.'/../resources/views' => resource_path('views/vendor/procontent'),
        ]);

        $this->loadRoutesFrom(__DIR__.'/routes/api.php');
    }
}
