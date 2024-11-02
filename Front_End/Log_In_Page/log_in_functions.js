// Auto Typing Function
const typedElement = document.querySelector(`.typed`);

const typed = new Typed(typedElement, {

    strings: ["A digital portfolio", "exclusively for grade 7 only", "a prototype portfolio"],
    typeSpeed: 60,
    backSpeed: 60,
    loop: true

});


// Dialog Modal Function
const dialog = document.querySelector(`#login-dialog`);
const closeDialog = document.querySelector(`#close-dialog`);

const showLogInDialog = (show) => show ? dialog.showModal() : dialog.close();
closeDialog.addEventListener('click', () => dialog.close());


// Toggle Password Function
const passwordInput = document.querySelector(`#password`);
const togglePassword = document.querySelector(`#togglePassword`);

togglePassword.addEventListener('click', function () {

    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye-slash');

});
