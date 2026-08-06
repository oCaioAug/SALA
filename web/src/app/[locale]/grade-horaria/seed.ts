"use server";

import { prisma } from "@/lib/prisma";
import { getOrgId } from "./actions";

export async function injectMockData() {
  const orgId = await getOrgId();

  // Limpar dados existentes
  await prisma.cargaHoraria.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.disponibilidade.deleteMany({ where: { professor: { organizationId: orgId } } });
  await prisma.turma.deleteMany({ where: { organizationId: orgId } });
  await prisma.disciplina.deleteMany({ where: { organizationId: orgId } });
  await prisma.professor.deleteMany({ where: { organizationId: orgId } });

  // 1. Configurar Turnos (Settings)
  // Faculdade Noturna com 2 janelas por dia
  const mockSettings = {
    timetabling: {
      shifts: [
        {
          id: "noturno",
          name: "Noturno",
          daysPerWeek: 6, // 6 dias (Seg a Sáb) para alocar EaD no sábado
          slots: [
            { id: "N1", label: "N1 (19:00 - 20:30)", startTime: "19:00", endTime: "20:30" },
            { id: "N2", label: "N2 (20:30 - 22:00)", startTime: "20:30", endTime: "22:00" }
          ]
        }
      ]
    }
  };

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
  const currentSettings = org?.settings && typeof org.settings === "object" ? org.settings : {};
  
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      settings: {
        ...currentSettings,
        timetabling: mockSettings.timetabling
      }
    }
  });

  // DADOS RAW
  // Como estamos em um semestre par (ex: 2026.2), só teremos as turmas de 2º, 4º, 6º e 8º período rodando.
  // Os ingressantes do semestre impar anterior e do par atual assistem juntos.
  const semestres = [
    {
      "numero": 2,
      "cargaHorariaTotalHoras": 480,
      "disciplinas": [
        { "nome": "Laboratório de Programação", "horaAulaAno": 80 },
        { "nome": "Banco de Dados", "horaAulaAno": 80 },
        { "nome": "Matemática", "horaAulaAno": 80 },
        { "nome": "Ferramentas de Gerenciamento de Redes", "horaAulaAno": 80 },
        { "nome": "Engenharia de Software", "horaAulaAno": 80 },
        { "nome": "Inglês Instrumental (EaD)", "horaAulaAno": 80 }
      ]
    },
    {
      "numero": 4,
      "cargaHorariaTotalHoras": 400,
      "disciplinas": [
        { "nome": "Cálculo I", "horaAulaAno": 40 },
        { "nome": "Laboratório de Desenvolvimento Mobile", "horaAulaAno": 80 },
        { "nome": "Linguagens de Programação", "horaAulaAno": 80 },
        { "nome": "Arquitetura de Computadores", "horaAulaAno": 40 },
        { "nome": "Computação nas Nuvens", "horaAulaAno": 80 },
        { "nome": "Projeto Integrador", "horaAulaAno": 80 }
      ]
    },
    {
      "numero": 6,
      "cargaHorariaTotalHoras": 400,
      "disciplinas": [
        { "nome": "Computação Gráfica", "horaAulaAno": 80 },
        { "nome": "Laboratório de Sistemas II (PHP)", "horaAulaAno": 80 },
        { "nome": "Arduíno", "horaAulaAno": 40 },
        { "nome": "Tópicos Avançados da Computação II", "horaAulaAno": 40 },
        { "nome": "Gerenciamento de Serviços de TI", "horaAulaAno": 80 },
        { "nome": "Projeto Integrador II", "horaAulaAno": 80 }
      ]
    },
    {
      "numero": 8,
      "cargaHorariaTotalHoras": 740,
      "disciplinas": [
        { "nome": "Elaboração de Projetos II", "horaAulaAno": 80 },
        { "nome": "Engenharia de Software II", "horaAulaAno": 80 },
        { "nome": "Projeto Final de Curso II *", "horaAulaAno": 40 },
        { "nome": "Laboratório de Desenvolvimento Mobile III", "horaAulaAno": 80 },
        { "nome": "Sistemas de Apoio a Decisão", "horaAulaAno": 80 },
        { "nome": "Tópicos Avançados da Computação IV", "horaAulaAno": 80 },
        { "nome": "Estágio Supervisionado *", "horaAulaAno": 300 } // Não alocado em sala de aula
      ]
    }
  ];

  const professoresInfo: any = {
    "professores": [
      {
        "id": 1,
        "nome": "Ana Paula Ribeiro",
        "disciplinas": [
          "Algoritmos e Programação",
          "Introdução ao Cálculo",
          "Tópicos Avançados da Computação III"
        ]
      },
      {
        "id": 2,
        "nome": "Bruno Henrique Santos",
        "disciplinas": [
          "Engenharia de Software",
          "Engenharia de Software II",
          "Gerência de Projetos"
        ]
      },
      {
        "id": 3,
        "nome": "Camila Duarte Lima",
        "disciplinas": [
          "Sistemas Operacionais",
          "Gerenciamento de Serviços de TI",
          "Arquitetura de Computadores"
        ]
      },
      {
        "id": 4,
        "nome": "Daniel Ferreira Alves",
        "disciplinas": [
          "Rede de Computadores",
          "Administração de Redes",
          "Ferramentas de Gerenciamento de Redes"
        ]
      },
      {
        "id": 5,
        "nome": "Eduarda Martins Rocha",
        "disciplinas": [
          "Jogos Digitais",
          "Jogos Digitais II",
          "Jogos Digitais III"
        ]
      },
      {
        "id": 6,
        "nome": "Felipe Augusto Nogueira",
        "disciplinas": [
          "Processamento de Dados",
          "Sistemas de Apoio a Decisão",
          "Tópicos Avançados da Computação"
        ]
      },
      {
        "id": 7,
        "nome": "Gabriela Azevedo Cardoso",
        "disciplinas": [
          "Ciências Humanas e Sociais",
          "Governança de TI",
          "UML Avançada"
        ]
      },
      {
        "id": 8,
        "nome": "Henrique Teixeira Moreira",
        "disciplinas": [
          "Banco de Dados",
          "Banco de Dados II"
        ]
      },
      {
        "id": 9,
        "nome": "Isabela Cristina Barbosa",
        "disciplinas": [
          "Laboratório de Programação",
          "Laboratório de Sistemas I (ASP.NET MVC)",
          "Projeto Integrador"
        ]
      },
      {
        "id": 10,
        "nome": "João Pedro Carvalho",
        "disciplinas": [
          "Matemática",
          "Cálculo I",
          "Probabilidade e Estatística (EaD)"
        ]
      },
      {
        "id": 11,
        "nome": "Karina Souza Vasconcelos",
        "disciplinas": [
          "Introdução ao Desenvolvimento Mobile",
          "Laboratório de Desenvolvimento Mobile II",
          "Laboratório de Desenvolvimento Mobile III",
          "Laboratório de Desenvolvimento Mobile"
        ]
      },
      {
        "id": 12,
        "nome": "Lucas Mendes Pereira",
        "disciplinas": [
          "Linguagens de Programação",
          "Laboratório de Sistemas II (PHP)",
          "Tópicos Avançados da Computação II"
        ]
      },
      {
        "id": 13,
        "nome": "Mariana Barbosa Teixeira",
        "disciplinas": [
          "Computação Gráfica",
          "Projeto Integrador II",
          "Tópicos Avançados da Computação IV"
        ]
      },
      {
        "id": 14,
        "nome": "Nicolas Viana Martins",
        "disciplinas": [
          "Administração de Redes",
          "Gerência de Projetos",
          "Sistemas Para Automação e Robótica"
        ]
      },
      {
        "id": 15,
        "nome": "Olívia Ribeiro Martins",
        "disciplinas": [
          "Inglês Instrumental (EaD)",
          "Computação nas Nuvens",
          "Elaboração de Projetos I",
          "Elaboração de Projetos II"
        ]
      }
    ],
    "disciplinaParaProfessores": {
      "Algoritmos e Programação": [1],
      "Ciências Humanas e Sociais": [7],
      "Sistemas Operacionais": [3],
      "Rede de Computadores": [4],
      "Jogos Digitais": [5],
      "Processamento de Dados": [6],
      "Laboratório de Programação": [9],
      "Banco de Dados": [8],
      "Matemática": [10],
      "Ferramentas de Gerenciamento de Redes": [4],
      "Engenharia de Software": [2],
      "Inglês Instrumental (EaD)": [15],
      "Introdução ao Cálculo": [1],
      "Introdução ao Desenvolvimento Mobile": [11],
      "Banco de Dados II": [8],
      "Organização de Computadores": [3],
      "Probabilidade e Estatística (EaD)": [10],
      "Jogos Digitais II": [5],
      "Administração de Redes": [4, 14],
      "Cálculo I": [10],
      "Laboratório de Desenvolvimento Mobile": [11],
      "Linguagens de Programação": [12],
      "Arquitetura de Computadores": [3],
      "Computação nas Nuvens": [15],
      "Projeto Integrador": [9],
      "Empreendedorismo Digital": [2],
      "Laboratório de Sistemas I (ASP.NET MVC)": [9],
      "Sistemas Para Automação e Robótica": [14],
      "Tópicos Avançados da Computação": [6],
      "Governança de TI": [7],
      "Jogos Digitais III": [5],
      "Computação Gráfica": [13],
      "Laboratório de Sistemas II (PHP)": [12],
      "Arduíno": [13],
      "Tópicos Avançados da Computação II": [12],
      "Gerenciamento de Serviços de TI": [3],
      "Projeto Integrador II": [13],
      "Elaboração de Projetos I": [15],
      "Gerência de Projetos": [2, 14],
      "UML Avançada": [7],
      "Projeto Final de Curso I *": [2],
      "Laboratório de Desenvolvimento Mobile II": [11],
      "Tópicos Avançados da Computação III": [1],
      "Elaboração de Projetos II": [15],
      "Engenharia de Software II": [2],
      "Projeto Final de Curso II *": [2],
      "Laboratório de Desenvolvimento Mobile III": [11],
      "Sistemas de Apoio a Decisão": [6],
      "Tópicos Avançados da Computação IV": [13],
      "Estágio Supervisionado *": [3, 2, 15]
    }
  };

  // Create turmas
  const turmaIds: Record<number, string> = {};
  for (const sem of semestres) {
    const t = await prisma.turma.create({
      data: {
        name: `Turma Mista (${sem.numero}º Período + Ingressantes)`,
        organizationId: orgId,
        shiftId: "noturno"
      }
    });
    turmaIds[sem.numero] = t.id;
  }

  // Collect all unique disciplines
  const uniqueDisciplinas = new Set<string>();
  for (const sem of semestres) {
    for (const d of sem.disciplinas) {
      uniqueDisciplinas.add(d.nome);
    }
  }

  // Create disciplinas
  const discIds: Record<string, string> = {};
  for (const nome of Array.from(uniqueDisciplinas)) {
    const d = await prisma.disciplina.create({
      data: {
        name: nome,
        organizationId: orgId
      }
    });
    discIds[nome] = d.id;
  }

  const disponibilidadePorProfessor: any = {
    "1": {
      "Segunda": ["19:00-20:30", "20:30-22:00"],
      "Terça": ["19:00-20:30"],
      "Quarta": ["20:30-22:00"],
      "Quinta": [],
      "Sexta": ["19:00-20:30"]
    },
    "2": {
      "Segunda": ["19:00-20:30"],
      "Terça": ["20:30-22:00"],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": ["20:30-22:00"],
      "Sexta": []
    },
    "3": {
      "Segunda": ["20:30-22:00"],
      "Terça": ["19:00-20:30"],
      "Quarta": [],
      "Quinta": ["19:00-20:30", "20:30-22:00"],
      "Sexta": ["19:00-20:30"]
    },
    "4": {
      "Segunda": ["19:00-20:30"],
      "Terça": [],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": ["20:30-22:00"],
      "Sexta": ["19:00-20:30"]
    },
    "5": {
      "Segunda": [],
      "Terça": ["19:00-20:30", "20:30-22:00"],
      "Quarta": ["20:30-22:00"],
      "Quinta": [],
      "Sexta": ["19:00-20:30", "20:30-22:00"]
    },
    "6": {
      "Segunda": [],
      "Terça": [],
      "Quarta": ["20:30-22:00"],
      "Quinta": ["19:00-20:30"],
      "Sexta": ["20:30-22:00"]
    },
    "7": {
      "Segunda": ["20:30-22:00"],
      "Terça": ["19:00-20:30"],
      "Quarta": ["19:00-20:30"],
      "Quinta": [],
      "Sexta": ["20:30-22:00"]
    },
    "8": {
      "Segunda": ["19:00-20:30"],
      "Terça": ["19:00-20:30", "20:30-22:00"],
      "Quarta": [],
      "Quinta": ["20:30-22:00"],
      "Sexta": ["19:00-20:30"]
    },
    "9": {
      "Segunda": [],
      "Terça": ["20:30-22:00"],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": ["19:00-20:30"],
      "Sexta": []
    },
    "10": {
      "Segunda": ["19:00-20:30"],
      "Terça": [],
      "Quarta": ["20:30-22:00"],
      "Quinta": ["19:00-20:30", "20:30-22:00"],
      "Sexta": ["20:30-22:00"],
      "Sábado": ["19:00-20:30", "20:30-22:00"]
    },
    "11": {
      "Segunda": ["20:30-22:00"],
      "Terça": ["19:00-20:30"],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": [],
      "Sexta": ["19:00-20:30"]
    },
    "12": {
      "Segunda": ["19:00-20:30"],
      "Terça": ["20:30-22:00"],
      "Quarta": ["19:00-20:30"],
      "Quinta": ["20:30-22:00"],
      "Sexta": []
    },
    "13": {
      "Segunda": ["20:30-22:00"],
      "Terça": [],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": ["19:00-20:30"],
      "Sexta": ["20:30-22:00"]
    },
    "14": {
      "Segunda": ["19:00-20:30"],
      "Terça": ["19:00-20:30", "20:30-22:00"],
      "Quarta": [],
      "Quinta": ["20:30-22:00"],
      "Sexta": ["19:00-20:30"]
    },
    "15": {
      "Segunda": [],
      "Terça": ["19:00-20:30"],
      "Quarta": ["19:00-20:30", "20:30-22:00"],
      "Quinta": ["19:00-20:30"],
      "Sexta": ["20:30-22:00"],
      "Sábado": ["19:00-20:30", "20:30-22:00"]
    }
  };

  const dayMap: Record<string, number> = {
    "Segunda": 1,
    "Terça": 2,
    "Quarta": 3,
    "Quinta": 4,
    "Sexta": 5,
    "Sábado": 6
  };

  const slotMap: Record<string, string> = {
    "19:00-20:30": "N1",
    "20:30-22:00": "N2"
  };

  // Create professores & availabilities
  const profIds: Record<number, string> = {};
  for (const p of professoresInfo.professores) {
    const prof = await prisma.professor.create({
      data: {
        name: p.nome,
        organizationId: orgId
      }
    });
    profIds[p.id] = prof.id;

    const dispMapUser = disponibilidadePorProfessor[p.id.toString()];
    const dispData = [];
    
    if (dispMapUser) {
      for (const [diaNome, janelas] of Object.entries(dispMapUser)) {
        const diaNum = dayMap[diaNome];
        for (const j of (janelas as string[])) {
          const sId = slotMap[j];
          if (diaNum && sId) {
            dispData.push({
              professorId: prof.id,
              diaSemana: diaNum,
              slotId: sId
            });
          }
        }
      }
    }

    if (dispData.length > 0) {
      await prisma.disponibilidade.createMany({ data: dispData });
    }
  }

  // Create Cargas Horárias
  const cargaData = [];
  for (const sem of semestres) {
    for (const d of sem.disciplinas) {
      const pIdsArray = professoresInfo.disciplinaParaProfessores[d.nome];
      
      // Estágio e TCC não alocam espaço na grade fixa presencial
      if (d.nome.includes("Estágio") || d.nome.includes("Projeto Final de Curso")) {
        continue;
      }

      if (pIdsArray && pIdsArray.length > 0) {
        const pId = profIds[pIdsArray[0]]; // Seleciona o primeiro professor apto
        
        // Em uma faculdade noturna, 1 bloco de 1.5h = 2 aulas.
        // Se a matéria tem 80h/ano, ela precisa de 2 blocos (quantidade = 2)
        const qtAulas = Math.round(d.horaAulaAno / 40); 
        
        if (qtAulas > 0) {
          cargaData.push({
            turmaId: turmaIds[sem.numero],
            disciplinaId: discIds[d.nome],
            professorId: pId,
            quantidadeAulas: qtAulas
          });
        }
      }
    }
  }
  
  await prisma.cargaHoraria.createMany({ data: cargaData });

  return true;
}
