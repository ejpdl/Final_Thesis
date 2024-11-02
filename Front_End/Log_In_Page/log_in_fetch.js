const login = document.querySelector(`#login-form`);

login.addEventListener('submit', async (event) => {

    event.preventDefault();

    const formData = new FormData(event.target);

    const data = {

        Student_ID: formData.get('id'),
        password: formData.get('password')

    };

    try{

        const response = await fetch(`http://localhost:5000/credentials/login`, {

            method: 'POST',
            body: JSON.stringify(data),
            headers: {

                'Content-Type'  :   'application/json',

            }

        });

        const result = await response.json();

        if(response.ok){

            localStorage.setItem('token', result.token);
            window.location.href = result.redirectUrl;

        }else{

            alert(result.msg);

        }

    }catch(error){

        console.log(error);
        alert(`The Server could be off or down`);

    }

});