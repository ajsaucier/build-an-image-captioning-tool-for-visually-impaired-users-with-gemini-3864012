let caption;

document.getElementById("imageInput").addEventListener("change", function(){
    let imagePreview = document.getElementById("imagePreview");
    const file = this.files[0]

    if (file) {
        imagePreview.src = URL.createObjectURL(file);
    } else {
        imagePreview.src = "https://placehold.co/500x300/orange/white"
    }
})

document.getElementById("submitBtn").addEventListener("click", function() {
    const imageInput = document.getElementById("imageInput");

    // if (imageInput.files.length > 0){
        const file = imageInput.files[0];
    // }

    getCaptionForImage(file);
})

document.getElementById("speakBtn").addEventListener("click", function() {
    speakText(caption);
})

async function getCaptionForImage(imageFile) {
    let formData = new FormData();
    formData.append("file", imageFile);

    try {
        displayCaption("Processing caption...");

        let response = await axios.post("http://localhost:1330/generate-caption", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        if (response.data) {
            caption = response.data;

            displayCaption(caption);
        }
    } catch (error) {
        displayCaption(error);
    }
}

function displayCaption(captionText) {
    const imageCaption = document.getElementById("imageCaption");

    imageCaption.textContent = captionText;
}

// Function is not necessary for screen reader users
function speakText(text) {
    if ("speechSynthesis" in window) {
        let speech = new SpeechSynthesisUtterance(text);

        speech.lang = "en-US";
        speech.rate = 1;
        speech.pitch = 1;

        window.speechSynthesis.speak(speech);
    } else {
        alert("Text-to-speech not supported by this browser.");
    }
}