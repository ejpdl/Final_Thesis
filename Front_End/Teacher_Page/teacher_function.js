document.addEventListener('DOMContentLoaded', function() {

    const menuLinks = document.querySelectorAll(`.menu li a`);
    const sectionsLink = document.querySelector(`#sectionsLink`);
    const sectionsMenu = document.querySelector(`#sectionsMenu`);

    function updateActiveLink(event) {

        menuLinks.forEach(link => {

            link.classList.remove('current');

        });

        event.target.classList.add('current');

    }

    menuLinks.forEach(link => {

        link.addEventListener('click', updateActiveLink);

    });

    sectionsLink.addEventListener('click', function(event) {

        event.preventDefault();
        sectionsMenu.classList.toggle('active');
        this.classList.toggle('current');

    });

    
    document.addEventListener('click', function(event) {

        if (!event.target.closest('.menu')) {

            sectionsMenu.classList.remove('active');
            sectionsLink.classList.remove('current');

        }

    });
    
});