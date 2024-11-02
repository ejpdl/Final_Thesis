// TO DISPLAY THE LOG IN CREDENTIALS USER
async function fetchUsers(){

    const token = localStorage.getItem("token");

    try{

        const response = await fetch(`http://localhost:5000/credentials/list`, {

            method: 'GET',
            headers: {

                'Content-Type'  :   'application/json',
                'Authorization' :  token

            },

        });

        const users = await response.json();
        const tableBody = document.querySelector(`#userTable tbody`);
        tableBody.innerHTML = '';

        let teacherCount = 0;
        let studentCount = 0;
        let adminCount = 0;

        users.forEach(user => {

            const row = document.createElement('tr');
            row.innerHTML = `

                <td> ${user.LogIn_ID} </td>
                <td> ${user.Student_ID} </td>
                <td> ${user.First_Name} </td>
                <td> ${user.Last_Name} </td>
                <td> ${user.Grade} </td>
                <td> ${user.Section} </td>
                <td> ${user.Role} </td>
                <td> 
                    <button class = "delete-button" onclick = "deleteUser('${user.Student_ID}')"> Delete </button>
                    <button class = "edit-user-button" onclick = "EditUser('${user.LogIn_ID}')"> Edit </button>
                </td>

            `;
            tableBody.appendChild(row);

            if(user.Role === 'teacher'){

                teacherCount++;

            }else if(user.Role === 'student'){

                studentCount++;

            }else if(user.Role === 'admin'){

                adminCount++;

            }
            
        });

        document.querySelector(`#Count`).textContent = `${teacherCount} teacher${teacherCount !== 1 ? 's' : ''}, ${studentCount} student${studentCount !== 1 ? 's' : ''}, ${adminCount} admin${adminCount !== 1 ? 's' : ''},`;

    }catch(error){

        console.log(error);

    }

}

fetchUsers();

// TO ADD STUDENT USERS
async function addUser(){

    const token = localStorage.getItem("token");

    const newUser = {

        LogIn_ID: document.querySelector(`#login_id`).value,
        Student_ID: document.querySelector(`#student_id`).value,
        Hash_Password: document.querySelector(`#password`).value,
        First_Name: document.querySelector(`#first_name`).value,
        Last_Name: document.querySelector(`#last_name`).value,
        Grade: document.querySelector(`#grade`).value,
        Section: document.querySelector(`#section`).value,
        role: document.querySelector(`#role`).value,

    };

    try{

        const response = await fetch(`http://localhost:5000/credentials/add`, {

            method: 'POST',
            headers: {

                'Content-Type'  : 'application/json',
                'Authorization' : token

            },

            body: JSON.stringify(newUser)

        });

        if(response.ok){

            alert(`User added as ${newUser.role}`);
            location.reload();
            fetchUsers();

        }else{

            const errorData = await response.json();
            console.log(errorData);
            alert(`Please Fill Out All Fields`);

        }

    }catch(error){

        console.log(error);

    }

}

// TO DELETE A USER
async function deleteUser(Student_ID){

    const token = localStorage.getItem("token");

    try{

        if(!confirm(`Are you sure you want to delete User ${Student_ID}?`)) return;

        const response = await fetch(`http://localhost:5000/credentials/delete/${Student_ID}`, {

            method: 'DELETE',
            headers: {

                'Authorization' : token

            }

        });

        if(response.ok){

            alert(`User deleted successfully`);
            fetchUsers();

        }else{

            const errorData = await response.json();
            alert(`Error Data: ${errorData}`);

        }

    }catch(error){

        console.log(error);

    }

}

async function EditUser(LogIn_ID){

    const token = localStorage.getItem("token");

    try{

        const response = await fetch(`http://localhost:5000/credentials/list/view/${LogIn_ID}`, {

            method: 'GET',
            headers: {

                'Authorization' : token,

            }

        });

        const data = await response.json();

        if(response.ok && data){

            document.querySelector(`#edit-header`).textContent = `Edit ${data.Last_Name} 's Credentials`;  

            document.querySelector(`#edit-student-id`).value = data.Student_ID;
            document.querySelector(`#edit-first_name`).value = data.First_Name;
            document.querySelector(`#edit-last_name`).value = data.Last_Name;
            document.querySelector(`#edit-last_name`).value = data.Last_Name;
            document.querySelector(`#edit-grade`).value = data.Grade;
            document.querySelector(`#edit-section`).value = data.Section;
            document.querySelector(`#edit-role`).value = data.Role;
            document.querySelector(`#edit-password`).value = data.Hash_Password;

            document.querySelector(`#edit-login_id`).value = data.LogIn_ID;

            showEditDialog(true);

        }

    }catch(error){

        console.log(error);

    }

    const update_information = document.querySelector(`#edit-button`);

    if(update_information){

        update_information.onclick = async (e) => {

            e.preventDefault();

            const newData = {

                Student_ID: document.querySelector(`#edit-student-id`).value,
                First_Name: document.querySelector(`#edit-first_name`).value,
                Last_Name: document.querySelector(`#edit-last_name`).value,
                Grade: document.querySelector(`#edit-grade`).value,
                Section: document.querySelector(`#edit-section`).value,
                Role: document.querySelector(`#edit-role`).value,
                LogIn_ID: document.querySelector(`#edit-login_id`).value

            };

            try{

                const UpdateResponse = await fetch(`http://localhost:5000/credentials/update`, {

                    method: 'PUT',
                    headers: {

                        'Content-Type'  : 'application/json',
                        'Authorization' : token
                    
                    },
                    
                    body: JSON.stringify(newData)

                });

                const result = await UpdateResponse.json();

                if(UpdateResponse.ok){

                    alert(`Successfully Updated`);
                    location.reload();

                }else{

                    console.log(result.error);
                    alert(`Error updating user: ${result.error}`);

                }

            }catch(error){

                console.log(error);

            }

        }

    }
    
}
