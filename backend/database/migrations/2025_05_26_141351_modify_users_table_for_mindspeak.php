<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Modify existing fields
            $table->string('name', 100)->change();
            $table->string('email', 150)->nullable()->change();
            
            // Add new fields
            $table->string('avatar', 255)->nullable()->after('password');
            $table->text('bio')->nullable()->after('avatar');
            $table->boolean('is_anonymous')->default(false)->after('bio');
            $table->enum('role', ['user', 'admin', 'moderator'])->default('user')->after('is_anonymous');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove added fields
            $table->dropColumn(['avatar', 'bio', 'is_anonymous', 'role']);
            
            // Revert field changes
            $table->string('name', 255)->change();
            $table->string('email', 255)->notNullable()->change();
        });
    }
};
