// George Nekwaya's birthdate
const birthdate = new Date("1991-01-24");

// Function to calculate the age and update the level and progress bar
function updateAgeProgress() {
  const currentDate = new Date("2024-05-26"); // Set the current date to May 26, 2024
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate the age in years and months
  let ageYears = currentYear - birthdate.getFullYear();
  let ageMonths = currentMonth - birthdate.getMonth();

  // Adjust the age if the current month is before the birth month
  if (ageMonths < 0) {
    ageYears--;
    ageMonths += 12;
  }

  // Calculate the progress percentage based on age
  const maxAge = 99; // Assuming a maximum age of 100
  const monthsInYear = 12;
  const totalMonths = ageYears * monthsInYear + ageMonths;
  const progressPercentage = ((totalMonths % monthsInYear) / monthsInYear) * 100;

  // Update the level number
  const levelElement = document.getElementById("level");
  levelElement.textContent = Math.floor(totalMonths / monthsInYear);

  // Update the mustard progress bar width
  const levelProgressElement = document.querySelector('.level-progress-bar');
  levelProgressElement.style.width = `${progressPercentage}%`;

  // Update the progress percentage text
  const percentageElement = document.getElementById("agePercentage");
  percentageElement.textContent = `${progressPercentage.toFixed(2)}%`;
}

// Call the updateAgeProgress function initially and every month
updateAgeProgress();
setInterval(updateAgeProgress, 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds

// Get the modal and close button
var modal = document.getElementById("inventoryModal");
var modalImage = document.getElementById("modalImage");
var closeButton = document.getElementsByClassName("close")[0];

// Get all inventory items
var inventoryItems = document.getElementsByClassName("inventory-item");

// Add click and hover event listeners to each inventory item
for (var i = 0; i < inventoryItems.length; i++) {
  inventoryItems[i].addEventListener("click", function() {
    var imgSrc = this.getElementsByTagName("img")[0].getAttribute("src");
    modalImage.setAttribute("src", imgSrc);
    modal.style.display = "block";

    // Remove the 'active' class from all other inventory items
    for (var j = 0; j < inventoryItems.length; j++) {
      inventoryItems[j].classList.remove("active");
    }

    this.classList.add("active");
  });

  inventoryItems[i].addEventListener("mouseover", function() {
    this.style.transform = "scale(1.1)";
    this.style.zIndex = "1";
    this.style.boxShadow = "0 0 10px rgba(65, 105, 225, 0.5)";
  });

  inventoryItems[i].addEventListener("mouseout", function() {
    if (!this.classList.contains("active")) {
      this.style.transform = "scale(1)";
      this.style.zIndex = "0";
      this.style.boxShadow = "0 2px 4px var(--shadow-color)";
    }
  });
}

// Close the modal when the close button is clicked
closeButton.addEventListener("click", function() {
  modal.style.display = "none";
  var activeItem = document.querySelector(".inventory-item.active");
  if (activeItem) {
    activeItem.classList.remove("active");
    activeItem.style.transform = "scale(1)";
    activeItem.style.zIndex = "0";
    activeItem.style.boxShadow = "0 2px 4px var(--shadow-color)";
  }
});

// Close the modal when clicking outside the modal content
window.addEventListener("click", function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    var activeItem = document.querySelector(".inventory-item.active");
    if (activeItem) {
      activeItem.classList.remove("active");
      activeItem.style.transform = "scale(1)";
      activeItem.style.zIndex = "0";
      activeItem.style.boxShadow = "0 2px 4px var(--shadow-color)";
    }
  }
});

// Animate profile card
const profileCard = document.querySelector('.profile-card');
profileCard.style.opacity = '0';
profileCard.style.transform = 'translateY(20px)';
setTimeout(() => {
  profileCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  profileCard.style.opacity = '1';
  profileCard.style.transform = 'translateY(0)';
}, 1000);

// Animate flag icons
const flagIcons = document.querySelectorAll('.flags img');
flagIcons.forEach((icon, index) => {
  icon.style.opacity = '0';
  icon.style.transform = 'translateY(20px)';
  setTimeout(() => {
    icon.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    icon.style.opacity = '1';
    icon.style.transform = 'translateY(0)';
  }, 1500 + (index * 100));
});

// Glitch effect on text
const glitchElements = document.querySelectorAll('.glitch');
glitchElements.forEach(element => {
  element.style.textShadow = '0 0 5px var(--glitch-color)';
  setInterval(() => {
    element.style.textShadow = `${getRandomInt(-5, 5)}px ${getRandomInt(-5, 5)}px 5px var(--glitch-color)`;
  }, 100);
});

// Smooth scroll animation
const navLinks = document.querySelectorAll('nav a');
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'smooth'
    });
  });
});

// Parallax effect
window.addEventListener('scroll', function() {
  const parallax = document.querySelector('.parallax');
  let scrollPosition = window.pageYOffset;
  parallax.style.backgroundPositionY = scrollPosition * 0.7 + 'px';
});

// Typing effect for hero content
const heroContent = document.querySelector('.hero-content');
const heroText = heroContent.querySelector('p').textContent;
heroContent.querySelector('p').textContent = '';
let i = 0;
function typeWriter() {
  if (i < heroText.length) {
    heroContent.querySelector('p').textContent += heroText.charAt(i);
    i++;
    setTimeout(typeWriter, 50);
  }
}
setTimeout(typeWriter, 1500);

// Animate project items on scroll
const projectItems = document.querySelectorAll('.project-item');
window.addEventListener('scroll', animateOnScroll);
animateOnScroll();
function animateOnScroll() {
  projectItems.forEach(item => {
    const itemPosition = item.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (itemPosition < windowHeight * 0.8) {
      item.classList.add('animate');
    } else {
      item.classList.remove('animate');
    }
  });
}

// Animate skill items on scroll
const skillItems = document.querySelectorAll('.skill-item');
window.addEventListener('scroll', animateSkillsOnScroll);
animateSkillsOnScroll();
function animateSkillsOnScroll() {
  skillItems.forEach(item => {
    const itemPosition = item.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (itemPosition < windowHeight * 0.8) {
      item.classList.add('animate');
    } else {
      item.classList.remove('animate');
    }
  });
}

// Animate chapter items on scroll
const chapterItems = document.querySelectorAll('.chapter');
window.addEventListener('scroll', animateChaptersOnScroll);
animateChaptersOnScroll();
function animateChaptersOnScroll() {
  chapterItems.forEach(item => {
    const itemPosition = item.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (itemPosition < windowHeight * 0.8) {
      item.classList.add('animate');
    } else {
      item.classList.remove('animate');
    }
  });
}

// Interactive navigation highlight
const sections = document.querySelectorAll('section');
const navLi = document.querySelectorAll('nav ul li');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute('id');
    }
  });
  navLi.forEach(li => {
    li.classList.remove('active');
    if (li.classList.contains(current)) {
      li.classList.add('active');
    }
  });
});

// Generate random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
