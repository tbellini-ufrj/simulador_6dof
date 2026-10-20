# Simulador 6DOF

Simulador web de um braço robótico de 6 graus de liberdade (6DOF), com visualização 3D, cinemática direta e inversa, geração de trajetórias e gráficos em tempo real.

## Informações do trabalho

- **Trabalho:** Desenvolvimento de um Simulador Web para Análise Cinemática de Manipuladores Robóticos de Seis Graus de Liberdade
- **Autor:** Thiago Bellini de Almeida Soares
- **Orientador:** Prof. Vitor Ferreira Romano, Dott. Ric.
- **Instituição:** Escola Politécnica da Universidade Federal do Rio de Janeiro (Poli/UFRJ)

## Tecnologias

- [Babylon.js](https://www.babylonjs.com/): renderização 3D e carregamento dos modelos STL
- [Chart.js](https://www.chartjs.org/): gráficos
- JavaScript, HTML e CSS (sem etapa de build)
- Python (NumPy): protótipo da cinemática inversa (`prototipo_IK.py`)

## Estrutura do projeto

| Arquivo | Descrição |
|---|---|
| `simulador.html` | Página principal e interface do simulador |
| `scene.js` | Cena 3D, juntas e modelos do braço |
| `aux_func.js` | Funções auxiliares |
| `trajectory_math.js` | Cálculo das trajetórias |
| `grafico.js` | Gráficos |
| `modelos/` | Modelos 3D (`.stl`) das peças do braço |
| `prototipo_IK.py` | Protótipo em Python da cinemática direta e inversa |

## Download

Com o Git:

```bash
git clone https://github.com/tbellini-ufrj/simulador_6dof.git
cd simulador_6dof
```

Ou, sem o Git, baixe o ZIP em **Code → Download ZIP** na [página do repositório](https://github.com/tbellini-ufrj/simulador_6dof) e extraia a pasta.

## Como rodar o simulador

É necessário ter um navegador moderno (Chrome, Edge ou Firefox) e **conexão com a internet**, pois as bibliotecas (Babylon.js e Chart.js) e os modelos 3D são carregados de servidores externos.

1. Abra a pasta do projeto.
2. Dê um duplo clique em `simulador.html` para abri-lo no navegador.
