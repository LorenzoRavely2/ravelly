const burger=document.getElementById('burger'),menu=document.getElementById('menu');
const iconeBurger=burger.querySelector('path');
function abrirFecharMenu(open){
  menu.dataset.open=open;
  burger.setAttribute('aria-expanded',open);
  burger.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  iconeBurger.setAttribute('d',open?'M6 6l12 12M18 6L6 18':'M4 7h16M4 12h16M4 17h16');
}
function fecharMenu(){abrirFecharMenu(false)}
burger.addEventListener('click',()=>abrirFecharMenu(menu.dataset.open!=='true'));
menu.querySelectorAll('.btn').forEach(b=>b.addEventListener('click',fecharMenu));
document.querySelectorAll('.faq__q').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const item=btn.closest('.faq__item'),open=!item.classList.contains('is-open');
    document.querySelectorAll('.faq__item.is-open').forEach(o=>{o.classList.remove('is-open');o.querySelector('.faq__q').setAttribute('aria-expanded','false')});
    if(open){item.classList.add('is-open');btn.setAttribute('aria-expanded','true')}
  });
});

// contato: monta a mensagem e abre o WhatsApp
const WHATSAPP = '5511995753310'; // DDI + DDD + número, só dígitos
const wppLink = document.getElementById('wppLink');
const formContato = document.getElementById('formContato');

function linkWhats(texto){
  return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
}

wppLink.href = linkWhats('Olá! Vim pelo site da Ravelly e queria conversar sobre um projeto.');

formContato.addEventListener('submit', e=>{
  e.preventDefault();
  const nome = formContato.nome.value.trim();
  const ideia = formContato.ideia.value.trim();
  const tipo = formContato.tipo.value;

  formContato.nome.classList.toggle('is-error', !nome);
  if(!nome){
    formContato.nome.focus();
    return;
  }

  let msg = 'Olá! Me chamo ' + nome + ' e vim pelo site da Ravelly.';
  msg += tipo ? ' Preciso de ' + tipo + '.' : ' Ainda não sei bem o que preciso.';
  if(ideia) msg += '\n\nSobre o projeto: ' + ideia;

  window.open(linkWhats(msg), '_blank', 'noopener');
});

formContato.nome.addEventListener('input', ()=>formContato.nome.classList.remove('is-error'));

document.getElementById('wppRodape').href = wppLink.href;

// menu: link ativo acompanha a rolagem da página
const secoes=['inicio','servicos','projetos','precos','contato'].map(id=>document.getElementById(id));
const linksDesktop=document.querySelectorAll('.links a');
const linksMobile=document.querySelectorAll('.menu a:not(.btn)');
let travado=false,timerTrava,ticking=false;

function marcar(i){
  [linksDesktop,linksMobile].forEach(lista=>lista.forEach((a,n)=>{
    if(n===i) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  }));
}
function atualizarAtivo(){
  ticking=false;
  if(travado) return;
  const y=window.scrollY+160;
  let atual=0;
  secoes.forEach((s,i)=>{ if(s && s.getBoundingClientRect().top+window.scrollY<=y) atual=i; });
  if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4) atual=secoes.length-1;
  if(window.scrollY<80) atual=0;
  marcar(atual);
}
function destravar(){ clearTimeout(timerTrava); timerTrava=setTimeout(()=>{travado=false;atualizarAtivo()},150); }

window.addEventListener('scroll',()=>{
  if(travado) destravar();
  if(!ticking){ticking=true;requestAnimationFrame(atualizarAtivo)}
},{passive:true});

[linksDesktop,linksMobile].forEach(lista=>lista.forEach((a,i)=>{
  a.addEventListener('click',()=>{
    marcar(i);
    travado=true;
    destravar();
    if(menu.dataset.open==='true') fecharMenu();
  });
}));
atualizarAtivo();
