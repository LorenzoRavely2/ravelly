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

// cupom: só vale quando a pessoa entra pelo link com ?cupom=CODIGO (ex.: vindo do painel do EasyTire)
const CUPONS = { EASYTIRE10: 10 }; // código -> % de desconto
const cupomUrl = (new URLSearchParams(location.search).get('cupom') || '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20);
const descontoCupom = CUPONS[cupomUrl] || 0;

let planoEscolhido = '';
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

  const nomeFmt = nome.split(/\s+/).map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' ');
  const tipoTxt = tipo || '';
  const fim = t => /[.!?…]$/.test(t) ? t : t + '.';

  let msg = 'Olá! Meu nome é ' + nomeFmt + ' e vim pelo site da Ravelly.';
  msg += tipoTxt
    ? ' Preciso de ' + tipoTxt + (planoEscolhido ? ' e tenho interesse no plano ' + planoEscolhido + '.' : '.')
    : ' Ainda não sei bem o que preciso e gostaria de ajuda para definir.';
  if(ideia) msg += '\n\nSobre o projeto: ' + fim(ideia);
  if(descontoCupom) msg += '\n\nTenho o cupom ' + cupomUrl + ' (' + descontoCupom + '% de desconto, indicação do EasyTire).';
  msg += '\n\nPodemos conversar?';

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


// animações de scroll
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // barra de progresso de leitura
  const barra=document.createElement('div');
  barra.className='scroll-progress';
  barra.setAttribute('aria-hidden','true');
  document.body.appendChild(barra);

  // paralaxe leve nos cards flutuantes do hero
  const vitrine=document.querySelector('.showcase');
  let rafScroll=false;
  function aoRolar(){
    rafScroll=false;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    barra.style.transform='scaleX('+(max>0?Math.min(window.scrollY/max,1):0)+')';
    if(vitrine){
      const r=vitrine.getBoundingClientRect();
      if(r.bottom>0&&r.top<window.innerHeight){
        const p=Math.max(-1,Math.min(1,(r.top+r.height/2-window.innerHeight/2)/window.innerHeight));
        vitrine.style.setProperty('--py-wa',(p*-22).toFixed(1)+'px');
        vitrine.style.setProperty('--py-perf',(p*34).toFixed(1)+'px');
      }
    }
  }
  window.addEventListener('scroll',()=>{if(!rafScroll){rafScroll=true;requestAnimationFrame(aoRolar)}},{passive:true});
  window.addEventListener('resize',aoRolar);
  aoRolar();

  // revelar elementos ao entrar na tela, com escalonamento entre os que aparecem juntos
  if(!('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(entradas=>{
    entradas
      .filter(e=>e.isIntersecting)
      .sort((a,b)=>a.target.compareDocumentPosition(b.target)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)
      .forEach((e,i)=>{
        const el=e.target,atraso=Math.min(i,5)*90;
        io.unobserve(el);
        el.style.transitionDelay=atraso+'ms';
        requestAnimationFrame(()=>el.classList.add('is-visible'));
        // ao terminar, remove o estado de animação para não interferir em hover/foco
        setTimeout(()=>{
          el.removeAttribute('data-reveal');
          el.classList.remove('is-visible');
          el.style.transitionDelay='';
        },atraso+1000);
      });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));
})();


// preços: abas por tipo de projeto
(function(){
  const abas=[...document.querySelectorAll('.ptab')];
  if(!abas.length) return;
  const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ativar(aba,foco){
    abas.forEach(a=>{
      const on=a===aba;
      a.setAttribute('aria-selected',on);
      a.tabIndex=on?0:-1;
      const painel=document.getElementById(a.getAttribute('aria-controls'));
      painel.hidden=!on;
      painel.classList.remove('anim');
      if(on&&!reduz){void painel.offsetWidth;painel.classList.add('anim')}
    });
    if(foco) aba.focus();
    centralizar();
  }
  // celular: os planos viram um carrossel; abre centralizado no Premium e mostra bolinhas
  const mobile=matchMedia('(max-width:640px)');
  const wrap=document.querySelector('.pwrap');
  const dots=document.createElement('div');
  dots.className='pdots';
  dots.setAttribute('aria-hidden','true');
  dots.innerHTML='<i></i><i></i><i></i>';
  wrap.appendChild(dots);
  function painelAtivo(){return wrap.querySelector('.plans:not([hidden])')}
  function marcarDots(){
    const p=painelAtivo(),cards=[...p.querySelectorAll('.plan')];
    const centro=p.scrollLeft+p.clientWidth/2;
    let melhor=0,dist=1e9;
    cards.forEach((c,i)=>{const d=Math.abs(c.offsetLeft+c.offsetWidth/2-centro);if(d<dist){dist=d;melhor=i}});
    [...dots.children].forEach((d,i)=>d.classList.toggle('is-on',i===melhor));
  }
  function centralizar(){
    if(!mobile.matches) return;
    requestAnimationFrame(()=>{
      const p=painelAtivo(),f=p.querySelector('.plan--featured');
      p.scrollLeft=f.offsetLeft-(p.clientWidth-f.offsetWidth)/2;
      marcarDots();
    });
  }
  wrap.querySelectorAll('.plans').forEach(p=>p.addEventListener('scroll',()=>requestAnimationFrame(marcarDots),{passive:true}));
  mobile.addEventListener('change',centralizar);
  centralizar();

  abas.forEach((a,i)=>{
    a.addEventListener('click',()=>ativar(a));
    a.addEventListener('keydown',e=>{
      const d={ArrowRight:1,ArrowLeft:-1}[e.key];
      if(d){e.preventDefault();ativar(abas[(i+d+abas.length)%abas.length],true)}
      if(e.key==='Home'){e.preventDefault();ativar(abas[0],true)}
      if(e.key==='End'){e.preventDefault();ativar(abas[abas.length-1],true)}
    });
  });

  // ao escolher um plano, já seleciona o tipo no formulário e guarda o plano na mensagem
  document.querySelectorAll('.plans .btn').forEach(b=>b.addEventListener('click',()=>{
    const tipo=b.closest('.plans').dataset.tipo;
    const radio=[...formContato.querySelectorAll('input[name="tipo"]')].find(r=>r.value===tipo);
    if(radio) radio.checked=true;
    planoEscolhido=b.closest('.plan').querySelector('h3').textContent.trim();
    const painel=b.closest('.plans');
    const aba=document.querySelector('.ptab[aria-controls="'+painel.id+'"]');
    const nivel=b.closest('.plan').querySelector('h3').textContent.trim();
    planoSelTipo.textContent=aba?aba.textContent.trim():'';planoSelNivel.textContent=nivel;
    planoSel.hidden=false;
  }));
  const planoSel=document.getElementById('planoSel'),planoSelTipo=document.getElementById('planoSelTipo'),planoSelNivel=document.getElementById('planoSelNivel');
  function limparPlano(){planoEscolhido='';planoSel.hidden=true}
  document.getElementById('planoSelX').addEventListener('click',limparPlano);
  formContato.querySelectorAll('input[name="tipo"]').forEach(r=>r.addEventListener('change',limparPlano));
})();

// aplica o cupom nos preços: mostra o valor original riscado e o valor com desconto
if(descontoCupom){
  const brl = n => 'R$' + n.toLocaleString('pt-BR');
  document.querySelectorAll('.price').forEach(p=>{
    const forte = p.querySelector('strong');
    const original = parseInt(forte.textContent.replace(/\D/g,''), 10);
    if(!original) return;
    const novo = Math.round(original * (100 - descontoCupom) / 100);
    const antigo = document.createElement('span');
    antigo.className = 'price__old';
    antigo.innerHTML = '<s aria-label="de ' + brl(original) + '">' + brl(original) + '</s><em>-' + descontoCupom + '%</em>';
    p.insertBefore(antigo, forte);
    forte.textContent = brl(novo);
    forte.setAttribute('aria-label', 'por ' + brl(novo));
  });
  const aviso = document.getElementById('cupomOk');
  document.getElementById('cupomOkCodigo').textContent = cupomUrl;
  document.getElementById('cupomOkPct').textContent = descontoCupom;
  aviso.hidden = false;
}
