<?php

namespace ProContent;

use Illuminate\Support\Facades\Facade;

class ProContentFacade extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'procontent';
    }
}
