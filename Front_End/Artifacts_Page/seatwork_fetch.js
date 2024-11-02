document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem('token');
    
    try{

        const response = await fetch('http://localhost:5000/view/seatwork', {

            method: 'GET',
            headers: {

                'Authorization' : token
            }

        });

        if(response.ok){

            const files = await response.json();
            const uploadedImagesContainer = document.querySelector(`#uploadedImagesContainer`);
            
            if(files.length > 0){

                files.forEach(file => {

                    const imageUrl = `http://localhost:5000/${file.File}`;
                    addImageCard(imageUrl, file);

                });


            }else{

                uploadedImage.style.display = 'none';
                uploadedImagesContainer.innerHTML = "<p> No Seatwork Found </p>";

            }
            

        }else{

            console.error("Error fetching uploaded files");

        }

    }catch(error){

        console.error("Error:", error);

    }

    document.querySelector(`#uploadForm`).addEventListener("submit", async function (e){

        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        const token = localStorage.getItem('token');

        try {

            const response = await fetch(form.action, {

                method: 'POST',
                body: formData,
                headers: {

                    'Authorization' :  token

                }

            });


            if (!response.ok) {
                
                console.error("Upload failed:", response.status, await response.text());
                alert("Error uploading file");
                return;

            }

                const data = await response.json();

                if(data.file_path){

                    const imageUrl = `http://localhost:5000/${data.file_path}`;
                    addImageCard(imageUrl, data);
                    alert("File uploaded successfully!");
                    location.reload();

                }else{

                    alert("File uploaded but image not found in response.");

                }

        }catch(error){

            console.error("Error:", error);
            alert("An error occurred while uploading.");

        }

    });

    const filterbuttons = document.querySelectorAll(`.filter-buttons button`);
    const filterablecards = document.querySelectorAll(`.filter-cards .card`);

    const filtercards = e => {

        document.querySelector(`.active`)?.classList.remove("active"); 
        e.target.classList.add("active");

        filterablecards.forEach(card => {

            card.classList.add("hide");

            if(card.dataset.name === e.target.dataset.name || e.target.dataset.name === "all"){

                card.classList.remove("hide");

            }

        });

    };

    filterbuttons.forEach(button => button.addEventListener("click", filtercards));

});


function addImageCard(fileUrl, fileData){

    const uploadedImagesContainer = document.querySelector(`#uploadedImagesContainer`);

    const card = document.createElement("div");
    card.classList.add("card");
    const subjectName = (fileData.Subject && typeof fileData.Subject === 'string') 
        ? fileData.Subject.toLowerCase() 
        : "unknown";
    card.setAttribute("data-name", subjectName); 

    let fileType;
    
    if(fileUrl.match(/\.(jpeg|jpg|png)$/)){

        // FOR IMAGES
        const imageLink = document.createElement("a");
        imageLink.href = fileUrl;
        imageLink.target = "_blank";
        imageLink.rel = "noopener noreferrer";

        fileType = document.createElement("img");
        fileType.src = fileUrl;
        fileType.alt = "Images";

        imageLink.appendChild(fileType);
        fileType = imageLink; 

    }else if(fileUrl.match(/\.(mp4|avi|mkv)$/)){

        // FOR VIDEOS
        fileType = document.createElement("video");
        fileType.src = fileUrl;
        fileType.controls = true;
        fileType.width = 700;
        fileType.height = 250; 

    }else if(fileUrl.match(/\.pdf$/)){

        // FOR PDF
        const pdfLink = document.createElement("a");
        pdfLink.href = fileUrl;
        pdfLink.target = "_blank";
        pdfLink.rel = "noopener noreferrer";

        const pdfIcon = document.createElement("img");
        pdfIcon.src = "../assets/image_placeholders/pdf.png"; 
        pdfIcon.alt = "PDF icon";

        pdfLink.appendChild(pdfIcon); 
        fileType = pdfLink

    }else{

        const pdfLink = document.createElement("a");
        pdfLink.href = fileUrl;
        pdfLink.target = "_blank";
        pdfLink.rel = "noopener noreferrer";

        const pdfIcon = document.createElement("img");
        pdfIcon.src = "../assets/image_placeholders/pdf.png"; 
        pdfIcon.alt = "PDF icon";

        pdfLink.appendChild(pdfIcon); 
        fileType = pdfLink
    
    }

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    const title = document.createElement("h6");
    title.classList.add("card-title");
    title.textContent = fileData.Title;

    const text = document.createElement("p");
    text.classList.add("card-text");
    text.textContent = `File: ${fileData.File || 'File not found'}`;

    const gradeText = document.createElement("p");
    gradeText.classList.add("card-grade");
    gradeText.textContent = `Grade: ${fileData.Grade || 'N/A'}`;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger");
    deleteButton.addEventListener("click", () => deleteCard(fileData.id, card));

    cardBody.appendChild(title);
    cardBody.appendChild(text);
    cardBody.appendChild(gradeText); 
    cardBody.appendChild(deleteButton); 
    card.appendChild(fileType);
    card.appendChild(cardBody);
    
    uploadedImagesContainer.appendChild(card); 

}

async function deleteCard(id, cardElement){

    const token = localStorage.getItem('token');

    if(confirm("Are you sure you want to delete this item?")){

        try{

            const response = await fetch(`http://localhost:5000/delete/seatwork`, {

                method: 'DELETE',
                headers: {

                    'Authorization' :  token,
                    'Content-Type'  :  'application/json'
                },

                body: JSON.stringify({ id })

            });

            if(response.ok){

                alert("File deleted successfully!");
                cardElement.remove(); 

            }else{

                console.error("Error deleting file:", await response.text());
                alert("Failed to delete file.");

            }

        }catch(error){

            console.error("Error:", error);
            alert("An error occurred while deleting.");

        }

    }
    
}

