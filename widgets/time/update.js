function (id, data) {
  console.log(id, data);
  document.getElementById(id+'_time').innerHTML = data.time;
  document.getElementById(id+'_date').innerHTML = data.date;
}
