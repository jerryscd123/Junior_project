# MindSpeak 🧠💭

A safe, anonymous confession platform designed to support mental health and well-being for university students.

## About MindSpeak

MindSpeak is a web-based confession platform that provides university students with a safe, anonymous space to share their thoughts, struggles, and experiences. The platform aims to reduce mental health stigma by creating a supportive community where students can express themselves freely without fear of judgment.

### Key Features

- **Anonymous Confessions**: Share thoughts and experiences completely anonymously
- **Mental Health Support**: Connect students with mental health resources and support
- **Community Support**: Read and relate to other students' experiences
- **Safe Environment**: Moderated platform ensuring a supportive and safe space
- **Resource Directory**: Access to mental health resources and counseling services
- **Crisis Support**: Quick access to emergency mental health resources

## Tech Stack

### Backend
- **Laravel 10.x** - PHP web application framework
- **MySQL/PostgreSQL** - Database management
- **PHP 8.1+** - Server-side programming language

### Frontend
- **Blade Templates** - Laravel's templating engine
- **Bootstrap/Tailwind CSS** - Responsive UI framework
- **JavaScript/jQuery** - Client-side interactivity
- **Laravel Livewire** - Dynamic components (if applicable)

### Additional Tools
- **Laravel Sanctum** - API authentication (if API is used)
- **Laravel Mail** - Email notifications
- **Laravel Queue** - Background job processing
- **Redis** - Caching and session management (optional)

## Installation & Setup

### Prerequisites
- PHP 8.1 or higher
- Composer
- Node.js & NPM
- MySQL or PostgreSQL database
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/mindspeak.git
cd mindspeak
```

### Step 2: Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### Step 3: Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Step 4: Database Setup
1. Create a new database for the project
2. Update your `.env` file with database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mindspeak
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Step 5: Database Migration
```bash
# Run database migrations
php artisan migrate

# (Optional) Seed the database with sample data
php artisan db:seed
```

### Step 6: Build Assets
```bash
# Compile CSS and JavaScript
npm run dev

# For production
npm run build
```

### Step 7: Start the Application
```bash
# Start the Laravel development server
php artisan serve
```

The application will be available at `http://localhost:8000`

## Configuration

### Mail Configuration
Update your `.env` file with mail settings for notifications:
```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-email-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@mindspeak.com
MAIL_FROM_NAME="MindSpeak"
```

### Queue Configuration (Optional)
For background processing:
```bash
# Start the queue worker
php artisan queue:work
```

## Usage

1. **Anonymous Posting**: Students can submit confessions anonymously
2. **Browse Confessions**: Read and relate to other students' experiences
3. **Support Resources**: Access mental health resources and emergency contacts
4. **Community Guidelines**: Follow platform rules for a safe environment

## Mental Health Resources

The platform includes:
- Emergency crisis hotlines
- University counseling services
- Online mental health resources
- Peer support groups
- Professional help directories

## Contributing

We welcome contributions to make MindSpeak better! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PSR-12 coding standards
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Security & Privacy

- All confessions are stored anonymously
- IP addresses are not logged or stored
- Regular security audits and updates
- GDPR compliant data handling

## Support

If you need help or have questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Laravel community for the amazing framework
- Mental health advocates and professionals
- University counseling services
- Contributors and supporters of mental health awareness

---

**Disclaimer**: MindSpeak is not a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.
