// ===== COOKING WEBSITE JAVASCRIPT =====

class CookingWebsite {
    constructor() {
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentCategory = 'all';
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.loadRecipes();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupModal();
        this.setupScrollToTop();
    }

    // ===== DATA LOADING =====
    async loadRecipes() {
        try {
            // In a real application, this would fetch from an API
            // For now, we'll use sample data
            const response = await fetch('recipes.json');
            if (response.ok) {
                this.recipes = await response.json();
            } else {
                // Fallback to sample data if JSON file doesn't exist
                this.recipes = this.getSampleRecipes();
            }
            
            this.filteredRecipes = [...this.recipes];
            this.renderRecipes();
        } catch (error) {
            console.log('Loading sample recipes...');
            this.recipes = this.getSampleRecipes();
            this.filteredRecipes = [...this.recipes];
            this.renderRecipes();
        }
    }

    getSampleRecipes() {
        return [
            {
                id: 1,
                title: "Classic Spaghetti Carbonara",
                description: "Creamy Italian pasta dish with eggs, cheese, and pancetta",
                category: "dinner",
                difficulty: "medium",
                prepTime: 15,
                cookTime: 20,
                servings: 4,
                ingredients: [
                    "400g spaghetti",
                    "200g pancetta or guanciale, diced",
                    "4 large eggs",
                    "100g Pecorino Romano cheese, grated",
                    "2 cloves garlic, minced",
                    "Black pepper to taste",
                    "Salt for pasta water"
                ],
                instructions: [
                    "Bring a large pot of salted water to boil and cook spaghetti according to package directions until al dente.",
                    "While pasta cooks, heat a large skillet over medium heat and cook pancetta until crispy, about 5-7 minutes.",
                    "In a bowl, whisk together eggs, grated cheese, and a generous amount of black pepper.",
                    "Add minced garlic to the pan with pancetta and cook for 1 minute until fragrant.",
                    "Drain pasta, reserving 1 cup of pasta water. Add hot pasta to the skillet with pancetta.",
                    "Remove pan from heat and quickly toss pasta with egg mixture, adding pasta water gradually until creamy.",
                    "Serve immediately with extra cheese and black pepper."
                ],
                image: null,
                nutrition: {
                    calories: 520,
                    protein: 24,
                    carbs: 68,
                    fat: 18
                }
            },
            {
                id: 2,
                title: "Fluffy Pancakes",
                description: "Light and airy breakfast pancakes that melt in your mouth",
                category: "breakfast",
                difficulty: "easy",
                prepTime: 10,
                cookTime: 15,
                servings: 4,
                ingredients: [
                    "2 cups all-purpose flour",
                    "2 tablespoons sugar",
                    "2 teaspoons baking powder",
                    "1 teaspoon salt",
                    "2 large eggs",
                    "1¾ cups milk",
                    "4 tablespoons melted butter",
                    "1 teaspoon vanilla extract",
                    "Butter for cooking"
                ],
                instructions: [
                    "In a large bowl, whisk together flour, sugar, baking powder, and salt.",
                    "In another bowl, beat eggs and then whisk in milk, melted butter, and vanilla.",
                    "Pour wet ingredients into dry ingredients and stir until just combined (lumps are okay).",
                    "Heat a griddle or large skillet over medium heat and butter lightly.",
                    "Pour ¼ cup batter per pancake onto griddle.",
                    "Cook until bubbles form on surface and edges look set, about 2-3 minutes.",
                    "Flip and cook until golden brown on other side, 1-2 minutes more.",
                    "Serve hot with maple syrup and butter."
                ],
                image: null,
                nutrition: {
                    calories: 285,
                    protein: 8,
                    carbs: 42,
                    fat: 9
                }
            },
            {
                id: 3,
                title: "Mediterranean Quinoa Salad",
                description: "Fresh and healthy salad packed with vegetables and Mediterranean flavors",
                category: "lunch",
                difficulty: "easy",
                prepTime: 20,
                cookTime: 15,
                servings: 6,
                ingredients: [
                    "1 cup quinoa, rinsed",
                    "2 cups vegetable broth",
                    "1 cucumber, diced",
                    "2 tomatoes, diced",
                    "1/2 red onion, finely chopped",
                    "1/2 cup kalamata olives, pitted and halved",
                    "1/2 cup feta cheese, crumbled",
                    "1/4 cup fresh parsley, chopped",
                    "2 tablespoons fresh mint, chopped",
                    "3 tablespoons olive oil",
                    "2 tablespoons lemon juice",
                    "1 teaspoon dried oregano",
                    "Salt and pepper to taste"
                ],
                instructions: [
                    "Cook quinoa in vegetable broth according to package directions. Let cool completely.",
                    "In a large bowl, combine cooled quinoa, cucumber, tomatoes, red onion, and olives.",
                    "Add crumbled feta cheese, parsley, and mint to the bowl.",
                    "In a small bowl, whisk together olive oil, lemon juice, oregano, salt, and pepper.",
                    "Pour dressing over salad and toss gently to combine.",
                    "Refrigerate for at least 30 minutes before serving to let flavors meld.",
                    "Serve chilled or at room temperature."
                ],
                image: null,
                nutrition: {
                    calories: 220,
                    protein: 8,
                    carbs: 28,
                    fat: 9
                }
            },
            {
                id: 4,
                title: "Chocolate Lava Cake",
                description: "Decadent individual chocolate cakes with molten centers",
                category: "dessert",
                difficulty: "medium",
                prepTime: 15,
                cookTime: 12,
                servings: 4,
                ingredients: [
                    "4 oz dark chocolate, chopped",
                    "4 tablespoons butter",
                    "2 large eggs",
                    "2 tablespoons granulated sugar",
                    "Pinch of salt",
                    "2 tablespoons all-purpose flour",
                    "Butter and cocoa powder for ramekins",
                    "Vanilla ice cream for serving",
                    "Powdered sugar for dusting"
                ],
                instructions: [
                    "Preheat oven to 425°F (220°C). Butter 4 ramekins and dust with cocoa powder.",
                    "Melt chocolate and butter in a double boiler or microwave, stirring until smooth.",
                    "In a bowl, whisk eggs, sugar, and salt until thick and pale.",
                    "Stir melted chocolate mixture into egg mixture.",
                    "Fold in flour until just combined.",
                    "Divide batter among prepared ramekins.",
                    "Bake for 12-14 minutes until edges are firm but centers still jiggle slightly.",
                    "Let cool for 1 minute, then run knife around edges and invert onto plates.",
                    "Dust with powdered sugar and serve immediately with ice cream."
                ],
                image: null,
                nutrition: {
                    calories: 320,
                    protein: 6,
                    carbs: 28,
                    fat: 22
                }
            },
            {
                id: 5,
                title: "Veggie Stir-Fry",
                description: "Quick and colorful vegetarian stir-fry with Asian flavors",
                category: "vegetarian",
                difficulty: "easy",
                prepTime: 15,
                cookTime: 10,
                servings: 4,
                ingredients: [
                    "2 tablespoons vegetable oil",
                    "3 cloves garlic, minced",
                    "1 inch fresh ginger, minced",
                    "1 bell pepper, sliced",
                    "1 cup broccoli florets",
                    "1 carrot, julienned",
                    "1 cup snap peas",
                    "200g mushrooms, sliced",
                    "3 tablespoons soy sauce",
                    "1 tablespoon sesame oil",
                    "1 teaspoon honey",
                    "1 tablespoon cornstarch mixed with 2 tablespoons water",
                    "2 green onions, chopped",
                    "1 tablespoon sesame seeds",
                    "Cooked rice for serving"
                ],
                instructions: [
                    "Heat vegetable oil in a large wok or skillet over high heat.",
                    "Add garlic and ginger, stir-fry for 30 seconds until fragrant.",
                    "Add bell pepper, broccoli, and carrot. Stir-fry for 3-4 minutes.",
                    "Add snap peas and mushrooms, continue stir-frying for 2-3 minutes.",
                    "In a small bowl, mix soy sauce, sesame oil, and honey.",
                    "Pour sauce over vegetables and toss to coat.",
                    "Add cornstarch slurry and stir until sauce thickens, about 1 minute.",
                    "Remove from heat, garnish with green onions and sesame seeds.",
                    "Serve immediately over steamed rice."
                ],
                image: null,
                nutrition: {
                    calories: 180,
                    protein: 6,
                    carbs: 16,
                    fat: 11
                }
            },
            {
                id: 6,
                title: "15-Minute Garlic Shrimp",
                description: "Quick and flavorful shrimp dish perfect for busy weeknights",
                category: "quick",
                difficulty: "easy",
                prepTime: 5,
                cookTime: 10,
                servings: 4,
                ingredients: [
                    "1 lb large shrimp, peeled and deveined",
                    "4 cloves garlic, minced",
                    "3 tablespoons olive oil",
                    "2 tablespoons butter",
                    "1/4 teaspoon red pepper flakes",
                    "1/4 cup white wine or chicken broth",
                    "2 tablespoons lemon juice",
                    "1/4 cup fresh parsley, chopped",
                    "Salt and pepper to taste",
                    "Pasta or rice for serving"
                ],
                instructions: [
                    "Season shrimp with salt and pepper.",
                    "Heat olive oil in a large skillet over medium-high heat.",
                    "Add shrimp and cook for 2 minutes per side until pink. Remove and set aside.",
                    "In same skillet, add butter and garlic. Cook for 1 minute until fragrant.",
                    "Add red pepper flakes and cook for 30 seconds.",
                    "Pour in wine or broth and lemon juice, simmer for 2 minutes.",
                    "Return shrimp to skillet and toss to coat in sauce.",
                    "Remove from heat and stir in fresh parsley.",
                    "Serve immediately over pasta or rice."
                ],
                image: null,
                nutrition: {
                    calories: 210,
                    protein: 23,
                    carbs: 3,
                    fat: 11
                }
            }
        ];
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value;
                this.handleSearch(query);
            });
        }

        // Category filtering
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.filterByCategory(category);
                this.scrollToSection('recipes');
            });
        });

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup();
            });
        }
    }

    // ===== NAVIGATION =====
    setupNavigation() {
        const navToggle = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Mobile menu toggle
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Scroll to section
                this.scrollToSection(targetId.substring(1));
            });
        });

        // Update navigation on scroll
        window.addEventListener('scroll', () => this.updateNavigation());
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const sectionTop = section.offsetTop - headerHeight;
            
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    updateNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // ===== RECIPE RENDERING =====
    renderRecipes() {
        const recipesGrid = document.getElementById('recipes-grid');
        if (!recipesGrid) return;

        if (this.isLoading) {
            recipesGrid.innerHTML = '<div class="loading"></div>';
            return;
        }

        if (this.filteredRecipes.length === 0) {
            recipesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No recipes found</h3>
                    <p>Try adjusting your search or browse our categories.</p>
                </div>
            `;
            return;
        }

        recipesGrid.innerHTML = this.filteredRecipes.map(recipe => `
            <div class="recipe-card fade-in" data-recipe-id="${recipe.id}" onclick="cookingWebsite.openRecipeModal(${recipe.id})">
                <div class="recipe-image">
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : '<i class="fas fa-utensils"></i>'}
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-meta">
                        <div class="recipe-time">
                            <i class="far fa-clock"></i>
                            <span>${recipe.prepTime + recipe.cookTime} min</span>
                        </div>
                        <div class="recipe-difficulty ${recipe.difficulty}">
                            ${recipe.difficulty}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ===== SEARCH AND FILTERING =====
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredRecipes = [...this.recipes];
        } else {
            this.filteredRecipes = this.recipes.filter(recipe =>
                recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.description.toLowerCase().includes(searchTerm) ||
                recipe.category.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(searchTerm)
                )
            );
        }

        this.renderRecipes();
        
        // Scroll to results if search was performed from hero section
        if (query) {
            this.scrollToSection('recipes');
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        
        if (category === 'all') {
            this.filteredRecipes = [...this.recipes];
        } else {
            this.filteredRecipes = this.recipes.filter(recipe => recipe.category === category);
        }

        this.renderRecipes();
    }

    // ===== MODAL FUNCTIONALITY =====
    setupModal() {
        const modal = document.getElementById('recipe-modal');
        const closeBtn = document.querySelector('.close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeRecipeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeRecipeModal();
                }
            });
        }

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeRecipeModal();
            }
        });
    }

    openRecipeModal(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const modal = document.getElementById('recipe-modal');
        const recipeDetails = document.getElementById('recipe-details');

        recipeDetails.innerHTML = `
            <div class="recipe-modal-header">
                <h2 class="recipe-modal-title">${recipe.title}</h2>
                <div class="recipe-modal-image">
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : '<i class="fas fa-utensils"></i>'}
                </div>
            </div>

            <div class="recipe-modal-meta">
                <div class="meta-item">
                    <i class="far fa-clock"></i>
                    <h4>Prep Time</h4>
                    <p>${recipe.prepTime} min</p>
                </div>
                <div class="meta-item">
                    <i class="fas fa-fire"></i>
                    <h4>Cook Time</h4>
                    <p>${recipe.cookTime} min</p>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <h4>Servings</h4>
                    <p>${recipe.servings}</p>
                </div>
                <div class="meta-item">
                    <i class="fas fa-chart-bar"></i>
                    <h4>Difficulty</h4>
                    <p class="recipe-difficulty ${recipe.difficulty}">${recipe.difficulty}</p>
                </div>
            </div>

            <div class="recipe-modal-content">
                <div class="ingredients-section">
                    <h3><i class="fas fa-list"></i> Ingredients</h3>
                    <ul class="ingredients-list">
                        ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>

                <div class="instructions-section">
                    <h3><i class="fas fa-clipboard-list"></i> Instructions</h3>
                    <ol class="instructions-list">
                        ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
            </div>

            ${recipe.nutrition ? `
                <div class="nutrition-info">
                    <h3><i class="fas fa-apple-alt"></i> Nutrition (per serving)</h3>
                    <div class="nutrition-grid">
                        <div class="nutrition-item">
                            <span class="nutrition-label">Calories</span>
                            <span class="nutrition-value">${recipe.nutrition.calories}</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Protein</span>
                            <span class="nutrition-value">${recipe.nutrition.protein}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Carbs</span>
                            <span class="nutrition-value">${recipe.nutrition.carbs}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Fat</span>
                            <span class="nutrition-value">${recipe.nutrition.fat}g</span>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeRecipeModal() {
        const modal = document.getElementById('recipe-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // ===== SCROLL TO TOP =====
    setupScrollToTop() {
        // Create scroll to top button
        const scrollTopBtn = document.createElement('button');
        scrollTopBtn.className = 'scroll-top';
        scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(scrollTopBtn);

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
    }

    // ===== NEWSLETTER =====
    async handleNewsletterSignup() {
        const emailInput = document.querySelector('.newsletter-input');
        const email = emailInput.value.trim();

        if (!email) {
            this.showMessage('Please enter your email address.', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Show loading message
        this.showMessage('Subscribing...', 'info');

        try {
            // EmailJS Integration - Uncomment this line after setting up EmailJS
             await this.sendEmailViaEmailJS(email);

            // For now, simulate success (remove this line after EmailJS is configured)
           // await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
            
        } catch (error) {
            console.error('Newsletter signup failed:', error);
            this.showMessage('Sorry, something went wrong. Please try again.', 'error');
        }
    }

    // EmailJS Integration
    async sendEmailViaEmailJS(subscriberEmail) {
        // TODO: Replace with your actual EmailJS credentials from https://www.emailjs.com/
        const SERVICE_ID = 'service_qf2944m';     // Get from EmailJS Dashboard
        const TEMPLATE_ID = 'template_5zvmcoj';   // Get from EmailJS Templates
        const PUBLIC_KEY = 'KHC9wg8lfYZShIk5T';       // Get from EmailJS Account Settings
        const YOUR_EMAIL = 'doubleawebdesigning@gmail.com'; // Replace with YOUR actual email address

        const templateParams = {
            to_email: YOUR_EMAIL,
            subscriber_email: subscriberEmail,
            message: `New newsletter subscription from: ${subscriberEmail}`,
            reply_to: subscriberEmail
        };

        return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    }

    // Formspree Integration
    async sendEmailViaFormspree(subscriberEmail) {
        const FORMSPREE_ENDPOINT = 'YOUR_FORMSPREE_ENDPOINT'; // Replace with your endpoint
        
        const formData = new FormData();
        formData.append('email', subscriberEmail);
        formData.append('message', `New newsletter subscription from: ${subscriberEmail}`);

        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Formspree submission failed');
        }

        return response.json();
    }

    // Custom API Integration
    async sendEmailViaAPI(subscriberEmail) {
        const API_ENDPOINT = 'YOUR_API_ENDPOINT'; // Replace with your API endpoint
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: subscriberEmail,
                type: 'newsletter_signup'
            })
        });

        if (!response.ok) {
            throw new Error('API submission failed');
        }

        return response.json();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===== UTILITY FUNCTIONS =====
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('message-notification');
        
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message-notification';
            messageEl.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 2000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(messageEl);
        }

        // Set message and style based on type
        messageEl.textContent = message;
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
            warning: '#ff9800'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        // Show message
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);

        // Hide message after delay
        setTimeout(() => {
            messageEl.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (messageEl && messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 4000);
    }

    // ===== PUBLIC API =====
    // Methods that can be called from outside
    searchRecipes(query) {
        document.getElementById('search-input').value = query;
        this.handleSearch(query);
    }

    showCategory(category) {
        this.filterByCategory(category);
        this.scrollToSection('recipes');
    }

    refreshRecipes() {
        this.loadRecipes();
    }
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.cookingWebsite = new CookingWebsite();
});

// ===== ADDITIONAL CSS FOR DYNAMIC ELEMENTS =====
const additionalStyles = `
    .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        color: #666;
    }

    .no-results i {
        font-size: 4rem;
        color: #ccc;
        margin-bottom: 1rem;
    }

    .no-results h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .nutrition-info {
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 10px;
    }

    .nutrition-info h3 {
        margin-bottom: 1rem;
        color: #2c3e50;
    }

    .nutrition-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .nutrition-item {
        text-align: center;
        padding: 0.8rem;
        background: white;
        border-radius: 8px;
        border: 2px solid #e9ecef;
    }

    .nutrition-label {
        display: block;
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.3rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .nutrition-value {
        display: block;
        font-size: 1.2rem;
        font-weight: 700;
        color: #2c3e50;
    }

    @media screen and (max-width: 768px) {
        .nutrition-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
`;

// Add the additional styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);