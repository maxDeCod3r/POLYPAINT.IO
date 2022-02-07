function initFileDropListner() {
	try{
		let dropZone = document.getElementById("dropzone")
		let imgPreview = document.getElementById("imgPreview")
		let svgElement = document.getElementById('svgElement')
		if (dropZone) {
			let fInput = document.getElementById('imgInput')
			dropZone.ondragover = function(){
				this.className = "dropzone dragover"
				imgPreview.setAttribute('style', 'display: none;')
				svgElement.setAttribute('style', 'display: block;')
				return false
			}

			dropZone.ondragleave = function(){
				this.className = "dropzone"
				// imgPreview.setAttribute('style', 'display:block')
				return false

			}
			dropZone.onclick = function(){
				fInput.click()
			}

			fInput.onchange = function(event) {
				let addedFile = event.target.files[0]
				fileAddSequence(addedFile)
			}

			dropZone.ondrop = function(event) {
				event.preventDefault()
				this.className = "dropzone"
				let droppedFile = event.dataTransfer.files[0]
				console.log(droppedFile)
				fileAddSequence(droppedFile)
				return false
			}
		}
	}
	catch(error){}
}

initFileDropListner()


function fileAddSequence(file){
	let fInput = document.getElementById('imgInput')
	if (["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
		let fileSize = file.size / 1024 / 1024
		if (fileSize < 10){
			fInput.files[0] = file
			let imgPreview = document.getElementById('imgPreview')
			let svgElement = document.getElementById('svgElement')
			imgPreview.src = URL.createObjectURL(file)
			imgPreview.setAttribute('style', 'display: block;')
			svgElement.setAttribute('style', 'display: none;')

			var canvas = document.getElementById("canvas");
			image = new MarvinImage();
			image.load(imgPreview.src, imageLoaded);
		} else {
			document.getElementById("api-response").innerHTML = "Files under 10MB please..."
			document.getElementById("api-response").setAttribute("style", "display: block")
		}
	} else {
		document.getElementById("api-response").innerHTML = "Accepted formats: jpeg/jpg, png, gif"
		document.getElementById("api-response").setAttribute("style", "display: block")
	}
}

function imageLoaded(){
	const offset_x = parseInt(document.getElementById("x_offset").value)
	const offset_y = parseInt(document.getElementById("y_offset").value)
	var pixel_ids = []
	var pixels = []
	for(var y=0; y<image.getHeight(); y++){
	  for(var x=0; x<image.getWidth(); x++){
		var red = image.getIntComponent0(x,y);
		var green = image.getIntComponent1(x,y);
		var blue = image.getIntComponent2(x,y);
		var alpha = image.getAlphaComponent(x,y);
		let r_hex = red.toString(16)
		let g_hex = green.toString(16)
		let b_hex = blue.toString(16)
		let pixel = ['0x', r_hex, g_hex, b_hex].join('');
		pixels.push(pixel)
		pixel_ids.push(parseInt((offset_x+x))+((offset_y+y)*1000))
	  }
	}
	document.getElementById("pixels").value = pixels
	document.getElementById("ids").value = pixel_ids
}

function calculate_img() {
	imageLoaded()

}
