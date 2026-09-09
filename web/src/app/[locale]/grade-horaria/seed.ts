"use server";

import { prisma } from "@/lib/prisma";
import { getOrgId } from "./actions";

type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX';
type Turno = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';

interface Disponibilidade {
  dia: DiaSemana;
  turno: Turno;
}

interface Professor {
  id: string;
  nome: string;
  disponibilidades: Disponibilidade[];
}

interface Turma {
  id: string;
  nome: string;
}

interface Disciplina {
  id: string;
  nome: string;
}

interface CargaHoraria {
  id: string;
  professorId: string;
  turmaId: string;
  disciplinaId: string;
  quantidadeAulas: number;
}

const turmasMock: Turma[] = [
  { id: '601', nome: 'Turma 601' },
  { id: '602', nome: 'Turma 602' },
  { id: '603', nome: 'Turma 603' },
  { id: '604', nome: 'Turma 604' },
  { id: '605', nome: 'Turma 605' },
  { id: '801', nome: 'Turma 801' },
  { id: '802', nome: 'Turma 802' },
  { id: '803', nome: 'Turma 803' },
  { id: '804', nome: 'Turma 804' },
  { id: '805', nome: 'Turma 805' },
];

const disciplinasMock: Disciplina[] = [
  { id: 'ART', nome: 'Arte' },
  { id: 'CIE', nome: 'Ciências' },
  { id: 'EDF', nome: 'Educação Física' },
  { id: 'GEOG', nome: 'Geografia' },
  { id: 'GEOM', nome: 'Geometria' },
  { id: 'HIS', nome: 'História' },
  { id: 'ING', nome: 'Inglês' },
  { id: 'MAT', nome: 'Matemática' },
  { id: 'POR', nome: 'Português' },
  { id: 'PT', nome: 'Produção Textual' },
];

const professoresMock: Professor[] = [
  {
    id: 'ADRIANA',
    nome: 'Adriana',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'ALE',
    nome: 'Ale',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      }
    ]
  },
  {
    id: 'ALESSANDRA',
    nome: 'Alessandra',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'ALZIRA',
    nome: 'Alzira',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      }
    ]
  },
  {
    id: 'CARLA',
    nome: 'Carla',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'DALLETE',
    nome: 'Dallete',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'DANIEL',
    nome: 'Daniel',
    disponibilidades: [
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      }
    ]
  },
  {
    id: 'FELIPE',
    nome: 'Felipe',
    disponibilidades: [
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'ISABEL',
    nome: 'Isabel',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      }
    ]
  },
  {
    id: 'JOAO_LUIS_MARILENE',
    nome: 'João Luis (Marilene)',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      }
    ]
  },
  {
    id: 'KARLA_NAZARE',
    nome: 'Karla Nazaré',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      }
    ]
  },
  {
    id: 'LUIZA',
    nome: 'Luiza',
    disponibilidades: [
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      }
    ]
  },
  {
    id: 'MAIARA',
    nome: 'Maiara',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      }
    ]
  },
  {
    id: 'MARCELO',
    nome: 'Marcelo',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      }
    ]
  },
  {
    id: 'MARCIONE',
    nome: 'Marcione',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      }
    ]
  },
  {
    id: 'MARIA_APARECIDA',
    nome: 'Maria Aparecida',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'PEDRO',
    nome: 'Pedro',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      }
    ]
  },
  {
    id: 'ROSEMEIRY',
    nome: 'Rosemeiry',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M2'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M4'
      }
    ]
  },
  {
    id: 'SERGIO',
    nome: 'Sergio',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M5'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      }
    ]
  },
  {
    id: 'SONIA',
    nome: 'Sonia',
    disponibilidades: [
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      },
      {
        dia: 'QUA',
        turno: 'M3'
      },
      {
        dia: 'QUA',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M2'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'QUI',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      }
    ]
  },
  {
    id: 'THAIS',
    nome: 'Thaís',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'SEX',
        turno: 'M1'
      },
      {
        dia: 'SEX',
        turno: 'M2'
      },
      {
        dia: 'SEX',
        turno: 'M3'
      },
      {
        dia: 'SEX',
        turno: 'M4'
      },
      {
        dia: 'SEX',
        turno: 'M5'
      },
      {
        dia: 'SEX',
        turno: 'M6'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      }
    ]
  },
  {
    id: 'VANESSA',
    nome: 'Vanessa',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'QUI',
        turno: 'M1'
      },
      {
        dia: 'QUI',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      }
    ]
  },
  {
    id: 'VITOR',
    nome: 'Vitor',
    disponibilidades: [
      {
        dia: 'SEG',
        turno: 'M1'
      },
      {
        dia: 'SEG',
        turno: 'M2'
      },
      {
        dia: 'SEG',
        turno: 'M3'
      },
      {
        dia: 'SEG',
        turno: 'M4'
      },
      {
        dia: 'SEG',
        turno: 'M5'
      },
      {
        dia: 'SEG',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M5'
      },
      {
        dia: 'QUA',
        turno: 'M6'
      },
      {
        dia: 'TER',
        turno: 'M1'
      },
      {
        dia: 'TER',
        turno: 'M2'
      },
      {
        dia: 'TER',
        turno: 'M3'
      },
      {
        dia: 'TER',
        turno: 'M4'
      },
      {
        dia: 'TER',
        turno: 'M5'
      },
      {
        dia: 'TER',
        turno: 'M6'
      },
      {
        dia: 'QUA',
        turno: 'M1'
      }
    ]
  }
];

const cargaHorariaMock: CargaHoraria[] = [
  { id: 'ADRIANA_601_PT', professorId: 'ADRIANA', turmaId: '601', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ADRIANA_602_PT', professorId: 'ADRIANA', turmaId: '602', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ADRIANA_604_POR', professorId: 'ADRIANA', turmaId: '604', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'ALE_603_POR', professorId: 'ALE', turmaId: '603', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'ALESSANDRA_802_PT', professorId: 'ALESSANDRA', turmaId: '802', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ALESSANDRA_803_PT', professorId: 'ALESSANDRA', turmaId: '803', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ALESSANDRA_804_POR', professorId: 'ALESSANDRA', turmaId: '804', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'ALESSANDRA_804_PT', professorId: 'ALESSANDRA', turmaId: '804', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ALESSANDRA_805_POR', professorId: 'ALESSANDRA', turmaId: '805', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'ALESSANDRA_805_PT', professorId: 'ALESSANDRA', turmaId: '805', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ALZIRA_801_CIE', professorId: 'ALZIRA', turmaId: '801', disciplinaId: 'CIE', quantidadeAulas: 4 },
  { id: 'ALZIRA_804_CIE', professorId: 'ALZIRA', turmaId: '804', disciplinaId: 'CIE', quantidadeAulas: 4 },
  { id: 'ALZIRA_805_CIE', professorId: 'ALZIRA', turmaId: '805', disciplinaId: 'CIE', quantidadeAulas: 4 },
  { id: 'CARLA_601_CIE', professorId: 'CARLA', turmaId: '601', disciplinaId: 'CIE', quantidadeAulas: 3 },
  { id: 'CARLA_602_CIE', professorId: 'CARLA', turmaId: '602', disciplinaId: 'CIE', quantidadeAulas: 3 },
  { id: 'CARLA_603_CIE', professorId: 'CARLA', turmaId: '603', disciplinaId: 'CIE', quantidadeAulas: 3 },
  { id: 'CARLA_604_CIE', professorId: 'CARLA', turmaId: '604', disciplinaId: 'CIE', quantidadeAulas: 3 },
  { id: 'CARLA_605_CIE', professorId: 'CARLA', turmaId: '605', disciplinaId: 'CIE', quantidadeAulas: 3 },
  { id: 'CARLA_802_CIE', professorId: 'CARLA', turmaId: '802', disciplinaId: 'CIE', quantidadeAulas: 4 },
  { id: 'CARLA_803_CIE', professorId: 'CARLA', turmaId: '803', disciplinaId: 'CIE', quantidadeAulas: 4 },
  { id: 'DALLETE_601_ING', professorId: 'DALLETE', turmaId: '601', disciplinaId: 'ING', quantidadeAulas: 3 },
  { id: 'DALLETE_602_ING', professorId: 'DALLETE', turmaId: '602', disciplinaId: 'ING', quantidadeAulas: 3 },
  { id: 'DALLETE_603_ING', professorId: 'DALLETE', turmaId: '603', disciplinaId: 'ING', quantidadeAulas: 3 },
  { id: 'DALLETE_604_ING', professorId: 'DALLETE', turmaId: '604', disciplinaId: 'ING', quantidadeAulas: 3 },
  { id: 'DALLETE_605_ING', professorId: 'DALLETE', turmaId: '605', disciplinaId: 'ING', quantidadeAulas: 3 },
  { id: 'DANIEL_601_EDF', professorId: 'DANIEL', turmaId: '601', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'DANIEL_602_EDF', professorId: 'DANIEL', turmaId: '602', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'DANIEL_603_EDF', professorId: 'DANIEL', turmaId: '603', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'DANIEL_605_EDF', professorId: 'DANIEL', turmaId: '605', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'DANIEL_801_EDF', professorId: 'DANIEL', turmaId: '801', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'DANIEL_804_EDF', professorId: 'DANIEL', turmaId: '804', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'FELIPE_601_GEOG', professorId: 'FELIPE', turmaId: '601', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'FELIPE_602_GEOG', professorId: 'FELIPE', turmaId: '602', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'FELIPE_603_GEOG', professorId: 'FELIPE', turmaId: '603', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'FELIPE_604_GEOG', professorId: 'FELIPE', turmaId: '604', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'FELIPE_605_GEOG', professorId: 'FELIPE', turmaId: '605', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'ISABEL_605_PT', professorId: 'ISABEL', turmaId: '605', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ISABEL_801_PT', professorId: 'ISABEL', turmaId: '801', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'ISABEL_802_POR', professorId: 'ISABEL', turmaId: '802', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'ISABEL_803_POR', professorId: 'ISABEL', turmaId: '803', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'JOAO_LUIS_MARILENE_605_MAT', professorId: 'JOAO_LUIS_MARILENE', turmaId: '605', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'JOAO_LUIS_MARILENE_801_MAT', professorId: 'JOAO_LUIS_MARILENE', turmaId: '801', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'JOAO_LUIS_MARILENE_805_GEOM', professorId: 'JOAO_LUIS_MARILENE', turmaId: '805', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'KARLA_NAZARE_601_POR', professorId: 'KARLA_NAZARE', turmaId: '601', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'KARLA_NAZARE_602_POR', professorId: 'KARLA_NAZARE', turmaId: '602', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'KARLA_NAZARE_603_PT', professorId: 'KARLA_NAZARE', turmaId: '603', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'KARLA_NAZARE_604_PT', professorId: 'KARLA_NAZARE', turmaId: '604', disciplinaId: 'PT', quantidadeAulas: 2 },
  { id: 'LUIZA_602_ART', professorId: 'LUIZA', turmaId: '602', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'LUIZA_604_ART', professorId: 'LUIZA', turmaId: '604', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'LUIZA_801_ART', professorId: 'LUIZA', turmaId: '801', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'LUIZA_803_ART', professorId: 'LUIZA', turmaId: '803', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'LUIZA_804_ART', professorId: 'LUIZA', turmaId: '804', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'MAIARA_601_GEOM', professorId: 'MAIARA', turmaId: '601', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'MAIARA_602_GEOM', professorId: 'MAIARA', turmaId: '602', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'MAIARA_603_MAT', professorId: 'MAIARA', turmaId: '603', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'MAIARA_604_MAT', professorId: 'MAIARA', turmaId: '604', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'MARCELO_801_HIS', professorId: 'MARCELO', turmaId: '801', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARCELO_802_HIS', professorId: 'MARCELO', turmaId: '802', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARCELO_803_HIS', professorId: 'MARCELO', turmaId: '803', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARCELO_804_HIS', professorId: 'MARCELO', turmaId: '804', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARCELO_805_HIS', professorId: 'MARCELO', turmaId: '805', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARCIONE_605_GEOM', professorId: 'MARCIONE', turmaId: '605', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'MARCIONE_801_GEOM', professorId: 'MARCIONE', turmaId: '801', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'MARCIONE_802_MAT', professorId: 'MARCIONE', turmaId: '802', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'MARCIONE_803_MAT', professorId: 'MARCIONE', turmaId: '803', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'MARCIONE_804_GEOM', professorId: 'MARCIONE', turmaId: '804', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'MARIA_APARECIDA_601_HIS', professorId: 'MARIA_APARECIDA', turmaId: '601', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARIA_APARECIDA_602_HIS', professorId: 'MARIA_APARECIDA', turmaId: '602', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARIA_APARECIDA_603_HIS', professorId: 'MARIA_APARECIDA', turmaId: '603', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARIA_APARECIDA_604_HIS', professorId: 'MARIA_APARECIDA', turmaId: '604', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'MARIA_APARECIDA_605_HIS', professorId: 'MARIA_APARECIDA', turmaId: '605', disciplinaId: 'HIS', quantidadeAulas: 3 },
  { id: 'PEDRO_801_GEOG', professorId: 'PEDRO', turmaId: '801', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'PEDRO_802_GEOG', professorId: 'PEDRO', turmaId: '802', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'PEDRO_803_GEOG', professorId: 'PEDRO', turmaId: '803', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'PEDRO_804_GEOG', professorId: 'PEDRO', turmaId: '804', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'PEDRO_805_GEOG', professorId: 'PEDRO', turmaId: '805', disciplinaId: 'GEOG', quantidadeAulas: 3 },
  { id: 'ROSEMEIRY_601_MAT', professorId: 'ROSEMEIRY', turmaId: '601', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'ROSEMEIRY_602_MAT', professorId: 'ROSEMEIRY', turmaId: '602', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'ROSEMEIRY_603_GEOM', professorId: 'ROSEMEIRY', turmaId: '603', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'ROSEMEIRY_604_GEOM', professorId: 'ROSEMEIRY', turmaId: '604', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'SERGIO_601_ART', professorId: 'SERGIO', turmaId: '601', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'SERGIO_603_ART', professorId: 'SERGIO', turmaId: '603', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'SERGIO_605_ART', professorId: 'SERGIO', turmaId: '605', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'SERGIO_802_ART', professorId: 'SERGIO', turmaId: '802', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'SERGIO_805_ART', professorId: 'SERGIO', turmaId: '805', disciplinaId: 'ART', quantidadeAulas: 2 },
  { id: 'SONIA_801_ING', professorId: 'SONIA', turmaId: '801', disciplinaId: 'ING', quantidadeAulas: 2 },
  { id: 'SONIA_802_ING', professorId: 'SONIA', turmaId: '802', disciplinaId: 'ING', quantidadeAulas: 2 },
  { id: 'SONIA_803_ING', professorId: 'SONIA', turmaId: '803', disciplinaId: 'ING', quantidadeAulas: 2 },
  { id: 'SONIA_804_ING', professorId: 'SONIA', turmaId: '804', disciplinaId: 'ING', quantidadeAulas: 2 },
  { id: 'SONIA_805_ING', professorId: 'SONIA', turmaId: '805', disciplinaId: 'ING', quantidadeAulas: 2 },
  { id: 'THAIS_802_GEOM', professorId: 'THAIS', turmaId: '802', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'THAIS_803_GEOM', professorId: 'THAIS', turmaId: '803', disciplinaId: 'GEOM', quantidadeAulas: 2 },
  { id: 'THAIS_804_MAT', professorId: 'THAIS', turmaId: '804', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'THAIS_805_MAT', professorId: 'THAIS', turmaId: '805', disciplinaId: 'MAT', quantidadeAulas: 5 },
  { id: 'VANESSA_605_POR', professorId: 'VANESSA', turmaId: '605', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'VANESSA_801_POR', professorId: 'VANESSA', turmaId: '801', disciplinaId: 'POR', quantidadeAulas: 5 },
  { id: 'VITOR_604_EDF', professorId: 'VITOR', turmaId: '604', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'VITOR_802_EDF', professorId: 'VITOR', turmaId: '802', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'VITOR_803_EDF', professorId: 'VITOR', turmaId: '803', disciplinaId: 'EDF', quantidadeAulas: 2 },
  { id: 'VITOR_805_EDF', professorId: 'VITOR', turmaId: '805', disciplinaId: 'EDF', quantidadeAulas: 2 },
];

export async function injectMockData(overrideOrgId?: string) {
  const orgId = overrideOrgId || await getOrgId();

  // Limpar dados existentes
  await prisma.cargaHoraria.deleteMany({ where: { turma: { organizationId: orgId } } });
  await prisma.disponibilidade.deleteMany({ where: { professor: { organizationId: orgId } } });
  await prisma.turma.deleteMany({ where: { organizationId: orgId } });
  await prisma.disciplina.deleteMany({ where: { organizationId: orgId } });
  await prisma.professor.deleteMany({ where: { organizationId: orgId } });

  // 1. Configurar Turnos (Settings)
  // Turno da Manhã com 6 slots por dia, Segunda a Sexta
  const mockSettings = {
    timetabling: {
      shifts: [
        {
          id: "manha",
          name: "Manhã",
          daysPerWeek: 5,
          slots: [
            { id: "M1", label: "07:00", startTime: "07:00", endTime: "07:45" },
            { id: "M2", label: "07:45", startTime: "07:45", endTime: "08:30" },
            { id: "M3", label: "08:30", startTime: "08:30", endTime: "09:15" },
            { id: "M4", label: "09:30", startTime: "09:30", endTime: "10:15" },
            { id: "M5", label: "10:15", startTime: "10:15", endTime: "11:00" },
            { id: "M6", label: "11:00", startTime: "11:00", endTime: "11:45" }
          ]
        }
      ]
    }
  };

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true }
  });

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

  // Create Turmas
  const tIdMap: Record<string, string> = {};
  for (const t of turmasMock) {
    const created = await prisma.turma.create({
      data: {
        name: t.nome,
        organizationId: orgId,
        shiftId: "manha"
      }
    });
    tIdMap[t.id] = created.id;
  }

  // Create Disciplinas
  const dIdMap: Record<string, string> = {};
  for (const d of disciplinasMock) {
    const created = await prisma.disciplina.create({
      data: {
        name: d.nome,
        code: d.id,
        organizationId: orgId
      }
    });
    dIdMap[d.id] = created.id;
  }

  // Create Professores & Disponibilidades
  const dayMap: Record<string, number> = {
    'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5
  };

  const pIdMap: Record<string, string> = {};
  for (const p of professoresMock) {
    // Collect unique disciplines for this professor from Cargas Horárias
    const profDisciplinas = Array.from(new Set(
      cargaHorariaMock
        .filter(ch => ch.professorId === p.id)
        .map(ch => dIdMap[ch.disciplinaId])
    ));

    const created = await prisma.professor.create({
      data: {
        name: p.nome,
        organizationId: orgId,
        disciplinas: {
          connect: profDisciplinas.filter(Boolean).map(id => ({ id }))
        }
      }
    });
    pIdMap[p.id] = created.id;

    if (p.disponibilidades) {
      const totalClasses = cargaHorariaMock
          .filter(ch => ch.professorId === p.id)
          .reduce((sum, ch) => sum + ch.quantidadeAulas, 0);
      
      // Adicionar uma folga de 7 horários além do que o professor precisa dar de aula (max 30)
      const targetAvailability = Math.min(30, totalClasses + 7);
      
      const allDays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
      const allSlots = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
      
      while (p.disponibilidades.length < targetAvailability) {
         const randomDay = allDays[Math.floor(Math.random() * allDays.length)];
         const randomSlot = allSlots[Math.floor(Math.random() * allSlots.length)];
         const exists = p.disponibilidades.find(d => d.dia === randomDay && d.turno === randomSlot);
         if (!exists) {
             p.disponibilidades.push({ dia: randomDay as any, turno: randomSlot as any });
         }
      }

      const dispData = p.disponibilidades.map(disp => ({
        professorId: created.id,
        diaSemana: dayMap[disp.dia],
        slotId: disp.turno
      }));
      await prisma.disponibilidade.createMany({ data: dispData });
    }
  }

  // Create Carga Horaria
  const chData = [];
  for (const ch of cargaHorariaMock) {
    chData.push({
      turmaId: tIdMap[ch.turmaId],
      disciplinaId: dIdMap[ch.disciplinaId],
      professorId: pIdMap[ch.professorId],
      quantidadeAulas: ch.quantidadeAulas
    });
  }

  if (chData.length > 0) {
    await prisma.cargaHoraria.createMany({ data: chData });
  }
}
