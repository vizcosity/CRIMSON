/**
 * Defines a series of functions usedful for debuging, such as the ability to
 * view the source image within the website, as well as toggling the
 * container borders & viewing the primitive IDs.
 */

// Add listener for toggling debug mode.
window.addEventListener('keypress', (e) => {

  if (e.key == 'd'){
    console.log(`DEBUG |`, `Toggling debug mode.`);
    toggleBorders();
    toggleHidden();
  }

});

function toggleBorders(){
  Array.from(document.getElementsByTagName('*'))
  .forEach(element => element.classList.toggle('show-border'));
}

function toggleHidden(){
  Array.from(document.getElementsByClassName('meta'))
  .forEach(label => label.classList.toggle('hidden'));
}
