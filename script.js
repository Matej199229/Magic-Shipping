document.addEventListener('DOMContentLoaded', function () {
    // Mobile Menu
    const toggleButton = document.querySelector('.navbar__mobile-menu-toggle');
    const mobileMenu = document.querySelector('.navbar__mobile-menu-items');
    
    // Add toggle functionality on hamburger menu
    toggleButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('active');
    })

  });


  // Change bg color on navbar when scrolling down the page
  const navbar = document.querySelector('.navbar');
  function togglenavbarTransparency() {
    if (window.scrollY > 0) {
      navbar.classList.add('navbar--scroll');
    } else {
      navbar.classList.remove('navbar--scroll');
    }
  }

  window.addEventListener('scroll', togglenavbarTransparency);

  // Can also write the same code the following way

  // window.addEventListener('scroll', function () {
  //   const navbar = document.querySelector('.navbar');
  
  //   if (window.scrollY > 0) {
  //     navbar.classList.add('navbar-scroll');
  //   } else {
  //     navbar.classList.remove('navbar-scroll');
  //   }
  // });