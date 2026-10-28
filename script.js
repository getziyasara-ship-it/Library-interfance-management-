let books = JSON.parse(localStorage.getItem("books")) || [];
let issues = JSON.parse(localStorage.getItem("issues")) || [];
const $ = id => document.getElementById(id);

function save() {
  localStorage.setItem("books", JSON.stringify(books));
  localStorage.setItem("issues", JSON.stringify(issues));
}
const issuedCount = id => issues.filter(i => i.bookId === id).length;

$("bookForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = { title: $("title").value.trim(), author: $("author").value.trim(),
    isbn: $("isbn").value.trim(), category: $("category").value.trim(), quantity: +$("quantity").value };
  const id = $("bookId").value;
  if (id) {
    const b = books.find(x => x.id === id);
    if (data.quantity < issuedCount(id)) return alert("Quantity cannot be less than issued copies.");
    Object.assign(b, data);
  } else {
    books.push({ id: Date.now().toString(), ...data });
  }
  e.target.reset(); $("bookId").value = ""; save(); render();
});

function editBook(id) {
  const b = books.find(x => x.id === id);
  ["title", "author", "isbn", "category", "quantity"].forEach(k => $(k).value = b[k]);
  $("bookId").value = id; window.scrollTo(0, 0);
}
function deleteBook(id) {
  if (issuedCount(id)) return alert("Cannot delete: copies are currently issued.");
  if (!confirm("Delete this book?")) return;
  books = books.filter(b => b.id !== id); save(); render();
}
function issueBook(id) {
  const b = books.find(x => x.id === id);
  if (b.quantity - issuedCount(id) <= 0) return alert("No copies available!");
  const name = prompt("Borrower name:");
  if (!name) return;
  const d = new Date(), due = new Date(); due.setDate(d.getDate() + 14);
  issues.push({ issueId: Date.now().toString(), bookId: id, borrower: name,
    issueDate: d.toISOString().slice(0, 10), dueDate: due.toISOString().slice(0, 10) });
  save(); render();
}
function returnBook(issueId) {
  issues = issues.filter(i => i.issueId !== issueId); save(); render();
}

function render() {
  const q = $("search").value.toLowerCase(), cat = $("filterCategory").value, av = $("filterAvail").value;
  const cats = [...new Set(books.map(b => b.category))];
  $("filterCategory").innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option ${c === cat ? "selected" : ""}>${c}</option>`).join("");

  const list = books.filter(b => {
    const a = b.quantity - issuedCount(b.id);
    return (b.title + b.author + b.isbn).toLowerCase().includes(q) &&
      (!cat || b.category === cat) &&
      (!av || (av === "available" ? a > 0 : a === 0));
  });
  $("bookList").innerHTML = list.map(b => {
    const iss = issuedCount(b.id), a = b.quantity - iss;
    return `<tr><td>${b.title}</td><td>${b.author}</td><td>${b.isbn}</td><td>${b.category}</td>
      <td>${b.quantity}</td><td>${a}</td><td>${iss}</td>
      <td><button onclick="issueBook('${b.id}')" ${a === 0 ? "disabled" : ""}>Issue</button>
      <button class="green" onclick="editBook('${b.id}')">Edit</button>
      <button class="danger" onclick="deleteBook('${b.id}')">Delete</button></td></tr>`;
  }).join("") || '<tr><td colspan="8">No books found.</td></tr>';

  const today = new Date().toISOString().slice(0, 10);
  $("issueList").innerHTML = issues.map(i => {
    const b = books.find(x => x.id === i.bookId);
    return `<tr><td>${b ? b.title : "-"}</td><td>${i.borrower}</td><td>${i.issueDate}</td>
      <td class="${i.dueDate < today ? "overdue" : ""}">${i.dueDate}</td>
      <td><button onclick="returnBook('${i.issueId}')">Return</button></td></tr>`;
  }).join("") || '<tr><td colspan="5">No books issued.</td></tr>';

  const total = books.reduce((s, b) => s + b.quantity, 0);
  $("statTitles").textContent = books.length;
  $("statIssued").textContent = issues.length;
  $("statAvail").textContent = total - issues.length;
}
["search", "filterCategory", "filterAvail"].forEach(id => $(id).addEventListener("input", render));
render();
