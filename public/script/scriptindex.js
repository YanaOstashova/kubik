function view(n) {
    style = document.getElementById(n).style;
    style.display = (style.display == 'block') ? 'none' : 'block';
}

//функция открия формы для написания отзыва
document.getElementById('form').style.display = 'none';

function openform() {
    document.getElementById('form').style.display = 'block';
}