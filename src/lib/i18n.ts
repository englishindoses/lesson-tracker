import { useCallback, useSyncExternalStore } from 'react'

/**
 * English and Brazilian Portuguese, side by side.
 *
 * One file, one entry per string, English first — a pair is easier to keep in
 * step than two separate dictionaries where a missing key only shows up at
 * runtime. No library: this is a two-language app that has to work offline.
 *
 * Dates and money don't live here. They are already Brazilian in both
 * languages (R$, 25/07/2026) — only the weekday and month names change, and
 * those are in format.ts.
 */

export type Lang = 'en' | 'pt'

const LANG_KEY = 'lt.lang'

const S = {
  // ------------------------------------------------------------------ common
  'common.save': ['Save', 'Salvar'],
  'common.cancel': ['Cancel', 'Cancelar'],
  'common.delete': ['Delete', 'Excluir'],
  'common.keep': ['Keep', 'Manter'],
  'common.done': ['Done', 'Pronto'],
  'common.close': ['Close', 'Fechar'],
  'common.back': ['← Back', '← Voltar'],
  'common.search': ['Search…', 'Buscar…'],
  'common.showActive': ['Show active', 'Ver ativos'],
  'common.showArchived': ['Show archived', 'Ver arquivados'],
  'common.reallyDelete': ['✓ really delete', '✓ excluir mesmo'],
  'common.tapAgain': ['Tap again to delete', 'Toque de novo para excluir'],
  'common.deleteRow': ['Delete row', 'Excluir linha'],
  'common.confirmDelete': ['Confirm delete', 'Confirmar exclusão'],

  // --------------------------------------------------------------------- app
  'app.title': ['Lesson Tracker', 'Controle de Aulas'],
  'app.students': ['Students', 'Alunos'],
  'app.settings': ['Settings', 'Configurações'],
  'app.opening': ['Opening the notebook…', 'Abrindo o caderno…'],
  'app.language': ['Language', 'Idioma'],

  'sync.offline': ['Offline', 'Offline'],
  'sync.offlinePending': ['Offline · {n} to send', 'Offline · {n} para enviar'],
  'sync.syncing': ['Syncing…', 'Sincronizando…'],
  'sync.synced': ['Saved', 'Salvo'],
  'sync.error': ['Sync problem', 'Erro de sincronização'],
  'sync.errorPending': ['Not sent · {n}', 'Não enviado · {n}'],
  'sync.unconfigured': ['No database', 'Sem banco de dados'],

  // -------------------------------------------------------------------- auth
  'auth.tagline': [
    'Lessons, students and money, in one notebook.',
    'Aulas, alunos e dinheiro, em um caderno só.',
  ],
  'auth.signIn': ['Sign in', 'Entrar'],
  'auth.signOut': ['Sign out', 'Sair'],
  'auth.createAccount': ['Create account', 'Criar conta'],
  'auth.createTitle': ['Create your account', 'Crie sua conta'],
  'auth.resetTitle': ['Reset password', 'Redefinir senha'],
  'auth.email': ['Email address', 'E-mail'],
  'auth.password': ['Password', 'Senha'],
  'auth.atLeast8': ['At least 8 characters', 'Pelo menos 8 caracteres'],
  'auth.working': ['Working…', 'Um momento…'],
  'auth.sendReset': ['Send reset email', 'Enviar e-mail de redefinição'],
  'auth.forgot': ['Forgot password?', 'Esqueceu a senha?'],
  'auth.backToSignIn': ['← Back to sign in', '← Voltar para entrar'],
  'auth.resetSent': [
    'Password reset email sent. Open the link in a real browser, not inside your email app.',
    'E-mail de redefinição enviado. Abra o link em um navegador de verdade, não dentro do aplicativo de e-mail.',
  ],
  'auth.confirmNotice': [
    'Account created. Supabase wants you to confirm your address first — check your email, or turn off Authentication → Sign In / Providers → Email → "Confirm email" in your Supabase dashboard and sign in straight away.',
    'Conta criada. O Supabase quer que você confirme o endereço primeiro — veja seu e-mail, ou desligue Authentication → Sign In / Providers → Email → "Confirm email" no painel do Supabase e entre direto.',
  ],
  'auth.badCredentials': [
    "That email and password don't match. If you haven't made an account yet, choose Create account.",
    'Esse e-mail e essa senha não combinam. Se você ainda não tem conta, escolha Criar conta.',
  ],
  'auth.setupTitle': ['One-time setup needed', 'Falta a configuração inicial'],
  'auth.setupIntro': [
    "The app can't reach a database yet. Create your free Supabase project, then:",
    'O aplicativo ainda não alcança um banco de dados. Crie seu projeto gratuito no Supabase e depois:',
  ],
  'auth.setup1': [
    'Open supabase/schema.sql from this project, paste it into the Supabase SQL Editor and run it.',
    'Abra supabase/schema.sql deste projeto, cole no SQL Editor do Supabase e execute.',
  ],
  'auth.setup2': [
    'In Supabase go to Project Settings → API and copy the Project URL and the publishable key.',
    'No Supabase vá em Project Settings → API e copie a Project URL e a chave publishable.',
  ],
  'auth.setup3': [
    'Copy .env.example to .env and paste both values in.',
    'Copie .env.example para .env e cole os dois valores.',
  ],
  'auth.setup4': ['Restart the dev server.', 'Reinicie o servidor de desenvolvimento.'],

  // ---------------------------------------------------------------- students
  'students.title': ['Students', 'Alunos'],
  'students.add': ['+ Student', '+ Aluno'],
  'students.noneArchived': ['Nobody archived.', 'Ninguém arquivado.'],
  'students.none': [
    'No students yet — add your first one.',
    'Nenhum aluno ainda — adicione o primeiro.',
  ],
  'students.notInClass': ['Not in a class yet', 'Ainda não está em nenhuma turma'],
  'students.one': ['Student', 'Aluno'],
  'students.new': ['New student', 'Novo aluno'],
  'students.deleteWarning': [
    'Delete permanently? Their lesson rows stay.',
    'Excluir de vez? As linhas de aula continuam.',
  ],
  'students.name': ['Name', 'Nome'],
  'students.level': ['Level', 'Nível'],
  'students.levelHint': ['B1, C1…', 'B1, C1…'],
  'students.contact': ['Contact', 'Contato'],
  'students.contactHint': ['Email, WhatsApp…', 'E-mail, WhatsApp…'],
  'students.needs': ['Needs / goals', 'Necessidades / objetivos'],
  'students.notes': ['Notes', 'Observações'],
  'students.archived': ['Archived (no longer studying)', 'Arquivado (não estuda mais)'],

  // ----------------------------------------------------------------- classes
  'classes.add': ['+ Class', '+ Turma'],
  'classes.outstanding': ['Outstanding:', 'Em aberto:'],
  'classes.noneArchived': ['Nothing archived.', 'Nada arquivado.'],
  'classes.none': [
    'No classes yet. Add students first, then set up a class.',
    'Nenhuma turma ainda. Cadastre os alunos primeiro e depois crie a turma.',
  ],
  'classes.noStudents': ['No students yet', 'Sem alunos ainda'],
  'classes.perLesson': ['{price}/lesson', '{price}/aula'],
  'classes.perMonth': ['{price}/month', '{price}/mês'],
  'classes.perLessonLong': ['{price} per lesson', '{price} por aula'],
  'classes.perMonthLong': ['{price} per month', '{price} por mês'],
  'classes.lessonCount': ['{n} lessons', '{n} aulas'],
  'classes.credit': ['{amount} credit', '{amount} de crédito'],
  'classes.settled': ['settled', 'em dia'],

  // ------------------------------------------------------------ class editor
  'classEditor.one': ['Class', 'Turma'],
  'classEditor.new': ['New class', 'Nova turma'],
  'classEditor.deleteWarning': [
    'Deletes every lesson and payment in it.',
    'Exclui todas as aulas e pagamentos dela.',
  ],
  'classEditor.name': ['Class name', 'Nome da turma'],
  'classEditor.nameHint': [
    'Tuesday Business — Marta & Piotr',
    'Business de terça — Marta e Piotr',
  ],
  'classEditor.lessonType': ['Lesson type', 'Tipo de aula'],
  'classEditor.usualLength': [
    'Usual lesson length (minutes)',
    'Duração normal da aula (minutos)',
  ],
  'classEditor.howCharged': ['How this class is charged', 'Como esta turma é cobrada'],
  'classEditor.perLesson': ['Per lesson', 'Por aula'],
  'classEditor.monthly': ['Monthly package', 'Pacote mensal'],
  'classEditor.pricePerLesson': ['Price per lesson (R$)', 'Preço por aula (R$)'],
  'classEditor.priceNote': [
    'Changing this only affects lessons you add from now on. Lessons already in the table keep the price they were charged at.',
    'Mudar isso só vale para as aulas que você adicionar daqui em diante. As aulas que já estão na tabela mantêm o preço com que foram cobradas.',
  ],
  'classEditor.monthlyPrice': ['Monthly price (R$)', 'Preço mensal (R$)'],
  'classEditor.monthlyNote': [
    'On a monthly package the lessons themselves cost nothing. Add one payment row per month — that row is the invoice, and ticking it paid clears the month.',
    'No pacote mensal as aulas em si não custam nada. Adicione uma linha de pagamento por mês — essa linha é a fatura, e marcá-la como paga quita o mês.',
  ],
  'classEditor.studentsIn': ['Students in this class', 'Alunos nesta turma'],
  'classEditor.priceIsPerClass': [
    '(price is for the class, not per head)',
    '(o preço é da turma, não por pessoa)',
  ],
  'classEditor.remove': ['Remove {name}', 'Remover {name}'],
  'classEditor.addStudent': ['+ Add student', '+ Adicionar aluno'],
  'classEditor.everyoneIn': [
    'Everyone is already in this class.',
    'Todo mundo já está nesta turma.',
  ],
  'classEditor.notes': ['Class notes', 'Observações da turma'],
  'classEditor.archived': ['Archived (finished course)', 'Arquivada (curso encerrado)'],

  // ------------------------------------------------------------- class view
  'classView.editClass': ['Edit class', 'Editar turma'],
  'classView.list': ['List', 'Lista'],
  'classView.calendar': ['Calendar', 'Calendário'],
  'classView.prevMonth': ['Previous month', 'Mês anterior'],
  'classView.nextMonth': ['Next month', 'Próximo mês'],
  'classView.allMonths': ['All months', 'Todos os meses'],
  'classView.filterMonth': ['Filter by month', 'Filtrar por mês'],
  'classView.filterKind': ['Filter by row type', 'Filtrar por tipo de linha'],
  'classView.kindAll': ['Lessons & payments', 'Aulas e pagamentos'],
  'classView.kindLesson': ['Lessons only', 'Só aulas'],
  'classView.kindPayment': ['Payments only', 'Só pagamentos'],
  'classView.filterPaid': ['Filter by paid status', 'Filtrar por pagamento'],
  'classView.paidAll': ['Paid & unpaid', 'Pagas e não pagas'],
  'classView.paidUnpaid': ['Unpaid only', 'Só não pagas'],
  'classView.paidPaid': ['Paid only', 'Só pagas'],
  'classView.filterPresence': ['Filter by presence', 'Filtrar por presença'],
  'classView.anyPresence': ['Any presence', 'Qualquer presença'],
  'classView.clearFilters': ['Clear filters', 'Limpar filtros'],
  'classView.addPayment': ['+ Payment', '+ Pagamento'],
  'classView.addLesson': ['+ Lesson', '+ Aula'],
  'classView.unpin': ['Unpin filters', 'Desafixar filtros'],
  'classView.pin': ['Pin filters to the top', 'Fixar filtros no topo'],
  'classView.pinned': [
    'Filters stay on screen — tap to unpin',
    'Os filtros ficam na tela — toque para desafixar',
  ],
  'classView.empty': ['Empty page. Add your first lesson.', 'Página vazia. Adicione a primeira aula.'],
  'classView.noMatches': ['Nothing matches these filters.', 'Nada corresponde a estes filtros.'],
  'classView.colDate': ['Date', 'Data'],
  'classView.colLength': ['Length', 'Duração'],
  'classView.colPresence': ['Presence', 'Presença'],
  'classView.colAmount': ['Amount', 'Valor'],
  'classView.colPaid': ['Paid', 'Pago'],
  'classView.colNotes': ['Notes', 'Observações'],
  'classView.dontChargeCol': [
    'Tick to not charge for this row',
    'Marque para não cobrar esta linha',
  ],
  'classView.due': ['due', 'vence'],
  'classView.payment': ['Payment', 'Pagamento'],
  'classView.lesson': ['Lesson', 'Aula'],
  'classView.extraNotes': ['Extra notes', 'Observações extras'],
  'classView.extraNotesHint': [
    'Extra notes — homework set, materials, anything else',
    'Observações extras — tarefa passada, materiais, o que for',
  ],
  'classView.extraNotesHintShort': [
    'Extra notes — homework, materials…',
    'Observações extras — tarefa, materiais…',
  ],
  'classView.addExtraNotes': ['+ extra notes', '+ observações extras'],
  'classView.repeatWeekly': ['Repeat weekly', 'Repetir toda semana'],
  'classView.minutes': ['Minutes', 'Minutos'],
  'classView.amountBRL': ['Amount (R$)', 'Valor (R$)'],
  'classView.figureCredit': ['Credit', 'Crédito'],
  'classView.figureUnpaid': ['Unpaid', 'Não pago'],
  'classView.figureOwed': ['Owed', 'Deve'],
  'classView.showing': ['Showing:', 'Mostrando:'],
  'classView.allRows': ['All:', 'Tudo:'],
  'classView.taught': ['Taught {time}', 'Dadas {time}'],
  'classView.scheduled': ['Scheduled {time}', 'Agendadas {time}'],
  'classView.charged': ['Charged {amount}', 'Cobrado {amount}'],
  'classView.received': ['Received {amount}', 'Recebido {amount}'],

  'repeat.title': ['Repeat weekly', 'Repetir toda semana'],
  'repeat.add': ['Add {n} lesson', 'Adicionar {n} aula'],
  'repeat.addPlural': ['Add {n} lessons', 'Adicionar {n} aulas'],
  'repeat.explain': [
    'Copies this lesson forward, one week apart, starting the week after {date}. Notes and presence start fresh on each copy.',
    'Copia esta aula para frente, de semana em semana, a partir da semana seguinte a {date}. Observações e presença começam em branco em cada cópia.',
  ],
  'repeat.howMany': ['How many?', 'Quantas?'],

  'date.openCalendar': ['Pick from a calendar', 'Escolher no calendário'],
  'calendar.add': ['Add an entry on {date}', 'Adicionar um registro em {date}'],

  // ------------------------------------------------------------ entry fields
  'entry.dontCharge': ['Don’t charge for this lesson', 'Não cobrar esta aula'],
  'entry.lessonDate': ['Lesson date', 'Data da aula'],
  'entry.dueDate': ['Due date', 'Vencimento'],
  'entry.date': ['Date', 'Data'],
  'entry.lengthMinutes': ['Lesson length in minutes', 'Duração da aula em minutos'],
  'entry.lengthLabel': ['Length (minutes)', 'Duração (minutos)'],
  'entry.presence': ['Presence', 'Presença'],
  'entry.priceForLesson': ['Price for this lesson', 'Preço desta aula'],
  'entry.paymentAmount': ['Payment amount', 'Valor do pagamento'],
  'entry.blankUsesClassPrice': [
    'Leave blank to use the class price',
    'Deixe em branco para usar o preço da turma',
  ],
  'entry.amountBlankHint': [
    'Amount (R$) — blank uses the class price',
    'Valor (R$) — em branco usa o preço da turma',
  ],
  'entry.amountLabel': ['Amount (R$)', 'Valor (R$)'],
  'entry.paymentReceived': ['Payment received', 'Pagamento recebido'],
  'entry.datePaid': ['Date paid', 'Data do pagamento'],
  'entry.nothingToPay': ['Nothing to pay', 'Nada a pagar'],
  'entry.notMarkedYet': [
    'No presence recorded yet — this lesson charges nothing until you mark it',
    'Presença ainda não registrada — esta aula não cobra nada até você marcá-la',
  ],
  'entry.coveredByPayment': ['Covered by a payment', 'Coberta por um pagamento'],
  'entry.markPaid': ['Mark paid', 'Marcar como paga'],
  'entry.markPaidHint': [
    'Mark paid — adds a payment row for this amount, dated today',
    'Marcar como paga — cria uma linha de pagamento com este valor, com a data de hoje',
  ],
  'entry.lessonNotes': ['Lesson notes', 'Observações da aula'],
  'entry.lessonNotesHint': ['Lesson notes…', 'Observações da aula…'],
  'entry.note': ['Note', 'Observação'],
  'entry.noteHint': ['Note…', 'Observação…'],
  'entry.paid': ['Paid', 'Pago'],
  'entry.extraNotesHint': ['Homework set, materials…', 'Tarefa passada, materiais…'],
  'entry.markPayment': ['Payment', 'Pagamento'],
  'entry.markPaymentReceived': ['Payment — received', 'Pagamento — recebido'],
  'entry.markPaymentDue': ['Payment — due', 'Pagamento — a receber'],
  'entry.markLessonPaid': ['{presence} — paid', '{presence} — paga'],

  // -------------------------------------------------------------- presence
  'presence.present': ['Present', 'Presente'],
  'presence.no_show': ['No-show', 'Faltou'],
  'presence.cancellation': ['Cancellation', 'Cancelamento'],
  'presence.late_cancellation': ['Late cancellation', 'Cancelamento em cima da hora'],
  'presence.teacher_cancellation': ['Teacher cancellation', 'Cancelamento meu'],
  'presence.reschedule': ['Rescheduled', 'Remarcada'],

  // ------------------------------------------------------------ lesson types
  'lessonType.conversation': ['Conversation', 'Conversação'],
  'lessonType.business': ['Business', 'Business'],
  'lessonType.exam': ['Exam prep', 'Preparação para prova'],
  'lessonType.general': ['General English', 'Inglês geral'],
  'lessonType.grammar': ['Grammar', 'Gramática'],
  'lessonType.kids': ['Kids', 'Crianças'],
  'lessonType.writing': ['Writing', 'Escrita'],
  'lessonType.other': ['Other', 'Outro'],

  // --------------------------------------------------------- spreadsheet (CSV)
  'csv.class': ['Class', 'Turma'],
  'csv.students': ['Students', 'Alunos'],
  'csv.type': ['Type', 'Tipo'],
  'csv.row': ['Row', 'Linha'],
  'csv.duration': ['Duration (min)', 'Duração (min)'],
  'csv.charged': ['Charged', 'Cobrada'],
  'csv.amount': ['Amount', 'Valor'],
  'csv.datePaid': ['Date paid', 'Data do pagamento'],
  'csv.yes': ['Yes', 'Sim'],
  'csv.no': ['No', 'Não'],
  'csv.charge': ['Charge', 'Cobrança'],
  'csv.payment': ['Payment received', 'Pagamento recebido'],
  'csv.status': ['Status', 'Situação'],
  'csv.contact': ['Contact', 'Contato'],
  'csv.level': ['Level', 'Nível'],
  'csv.needs': ['Needs', 'Necessidades'],
  'csv.studentNotes': ['Notes about the student', 'Observações sobre o aluno'],
  'csv.archived': ['Archived', 'Arquivado'],
  'csv.classes': ['Classes', 'Turmas'],
  'csv.lessonCount': ['Lessons', 'Aulas'],
  'csv.taughtTime': ['Time taught (min)', 'Tempo dado (min)'],
  'csv.scheduledTime': ['Time on the books (min)', 'Tempo agendado (min)'],
  'csv.received': ['Received', 'Recebido'],
  'csv.owedNow': ['Owed now', 'Devendo agora'],
  'csv.months': ['Months', 'Meses'],
  'csv.pricing': ['Pricing', 'Cobrança'],
  'csv.price': ['Price', 'Preço'],
  'csv.className': ['Class', 'Turma'],
  'csv.allMonths': ['Everything', 'Tudo'],
  'csv.status.paid': ['Paid', 'Paga'],
  'csv.status.due': ['Unpaid', 'A pagar'],
  'csv.status.free': ['No charge', 'Sem cobrança'],
  'csv.status.pending': ['Not marked yet', 'Ainda não marcada'],
  'csv.status.received': ['Received', 'Recebido'],
  'csv.status.expected': ['Still expected', 'A receber'],

  // ---------------------------------------------------------------- settings
  'settings.look': ['Look', 'Aparência'],
  'settings.lookHint': [
    'Start from a preset, then change any part of it — nothing here is locked together.',
    'Comece por um conjunto pronto e mude o que quiser — nada aqui está preso a nada.',
  ],
  'settings.presets': ['Presets', 'Conjuntos prontos'],
  'settings.ownMix': ['Your own mix — no preset ticked.', 'Sua própria mistura — nenhum conjunto marcado.'],
  'settings.mode': ['Light or dark', 'Claro ou escuro'],
  'settings.colours': ['Colours', 'Cores'],
  'settings.lettering': ['Lettering', 'Letra'],
  'settings.paper': ['Paper', 'Papel'],
  'settings.edges': ['Edges', 'Bordas'],
  'settings.doodles': ['Margin doodles', 'Rabiscos nas margens'],
  'settings.doodlesOnPhone': ['Doodles on the phone too', 'Rabiscos no celular também'],
  'settings.doodlesOnPhoneHint': [
    'A phone has no margins, so only the corner ones are drawn.',
    'O celular não tem margem, então só os dos cantos aparecem.',
  ],
  'settings.account': ['Account', 'Conta'],
  'settings.stayIn': ['Stay signed in', 'Continuar conectada'],
  'settings.stayInHint': [
    'Off means signing in again each time the browser is closed.',
    'Desligado, você entra de novo cada vez que fechar o navegador.',
  ],
  'settings.changePassword': ['Change password', 'Trocar senha'],
  'settings.newPassword': ['New password', 'Senha nova'],
  'settings.repeatPassword': ['Repeat it', 'Repita a senha'],
  'settings.saving': ['Saving…', 'Salvando…'],
  'settings.tooShort': ['Use at least 8 characters.', 'Use pelo menos 8 caracteres.'],
  'settings.noMatch': ['The two passwords do not match.', 'As duas senhas não são iguais.'],
  'settings.changed': ['Password changed.', 'Senha alterada.'],
  'settings.offlinePassword': [
    'You are offline — a password change needs a connection.',
    'Você está offline — trocar a senha precisa de conexão.',
  ],
  'settings.noDatabase': ['No database is configured.', 'Nenhum banco de dados configurado.'],
  'settings.data': ['Your data', 'Seus dados'],
  'settings.dataHint': [
    'Spreadsheets of whichever months you need, and a full backup.',
    'Planilhas dos meses que você quiser, e um backup completo.',
  ],
  'settings.backup': ['Backup everything (JSON)', 'Backup de tudo (JSON)'],
  'settings.backupHint': [
    'The backup is always the whole thing — the choices above only shape the spreadsheets.',
    'O backup é sempre tudo — as escolhas acima valem só para as planilhas.',
  ],
  'settings.exportStudents': ['Students (CSV)', 'Alunos (CSV)'],
  'settings.exportStudentsHint': [
    'One row per student: their details, their classes, and how many lessons they had in the months chosen.',
    'Uma linha por aluno: os dados dele, as turmas e quantas aulas teve nos meses escolhidos.',
  ],
  'settings.exportClasses': ['Classes and money (CSV)', 'Turmas e valores (CSV)'],
  'settings.exportClassesHint': [
    'One row per class, with the money: charged, received and owed. Money belongs to a class, not to a person — a class can have two students in it.',
    'Uma linha por turma, com os valores: cobrado, recebido e devendo. O dinheiro é da turma, não da pessoa — uma turma pode ter dois alunos.',
  ],
  'settings.exportLessons': ['Lessons and payments (CSV)', 'Aulas e pagamentos (CSV)'],
  'settings.exportLessonsHint': [
    'One row per lesson and payment, with what it charged and whether it is paid.',
    'Uma linha por aula e por pagamento, com o valor cobrado e se está pago.',
  ],
  'settings.exportMonths': ['Months', 'Meses'],
  'settings.exportFrom': ['From', 'De'],
  'settings.exportTo': ['To', 'Até'],
  'settings.fromStart': ['The start', 'O começo'],
  'settings.toEnd': ['Today', 'Hoje'],
  'settings.includeArchived': [
    'Include archived students and classes',
    'Incluir alunos e turmas arquivados',
  ],
  'settings.includeArchivedHint': [
    'Off by default, so an old student does not turn up in this year’s figures.',
    'Desligado por padrão, para um aluno antigo não aparecer nos números deste ano.',
  ],
  'settings.nothingToExport': [
    'Nothing matches those months.',
    'Nada corresponde a esses meses.',
  ],
  'settings.language': ['Language', 'Idioma'],
  'settings.languageHint': [
    'Changes the app’s wording. Dates and money stay Brazilian either way.',
    'Muda os textos do aplicativo. Datas e valores continuam brasileiros nos dois casos.',
  ],

  // ------------------------------------------------------- theme option names
  'mode.light': ['Light', 'Claro'],
  'mode.dark': ['Dark', 'Escuro'],
  'mode.system': ['Match device', 'Seguir o aparelho'],

  'palette.sage': ['Sage', 'Sálvia'],
  'palette.sage.hint': ['Muted sage, terracotta, ochre', 'Sálvia, terracota e ocre suaves'],
  'palette.peach': ['Peach', 'Pêssego'],
  'palette.peach.hint': ['Warm cream and soft pastels', 'Creme quente e pastéis suaves'],
  'palette.neon': ['Neon', 'Neon'],
  'palette.neon.hint': ['Bright coral, lime and orange', 'Coral, limão e laranja vibrantes'],
  'palette.ocean': ['Ocean', 'Oceano'],
  'palette.ocean.hint': ['Teal, sea blue and sand', 'Turquesa, azul-mar e areia'],
  'palette.plum': ['Plum', 'Ameixa'],
  'palette.plum.hint': ['Purple, berry and dusty pink', 'Roxo, amora e rosa empoeirado'],
  'palette.forest': ['Forest', 'Floresta'],
  'palette.forest.hint': ['Deep green, moss and bark', 'Verde escuro, musgo e casca de árvore'],
  'palette.mono': ['Mono', 'Mono'],
  'palette.mono.hint': ['Greys with one blue accent', 'Cinzas com um toque de azul'],
  'palette.slate': ['Slate', 'Ardósia'],
  'palette.slate.hint': ['Plain white and office blue', 'Branco liso e azul de escritório'],

  'fonts.quicksand': ['Rounded', 'Arredondada'],
  'fonts.quicksand.hint': ['Quicksand headings, Inter text', 'Títulos Quicksand, texto Inter'],
  'fonts.script': ['Script', 'Cursiva'],
  'fonts.script.hint': ['Sacramento and Caveat', 'Sacramento e Caveat'],
  'fonts.sketch': ['Sketch', 'Rabiscada'],
  'fonts.sketch.hint': ['Amatic SC and Patrick Hand', 'Amatic SC e Patrick Hand'],
  'fonts.serif': ['Serif', 'Serifada'],
  'fonts.serif.hint': ['Classic book lettering', 'Letra clássica de livro'],
  'fonts.typewriter': ['Typewriter', 'Máquina de escrever'],
  'fonts.typewriter.hint': [
    'Even-width, like a typed page',
    'Largura fixa, como uma página datilografada',
  ],
  'fonts.system': ['Plain', 'Simples'],
  'fonts.system.hint': ['Your device sans-serif', 'A fonte do seu aparelho'],

  'paper.dots': ['Dot grid', 'Pontilhado'],
  'paper.dots.hint': ['The bullet journal standard', 'O padrão do bullet journal'],
  'paper.ruled': ['Ruled', 'Pautado'],
  'paper.ruled.hint': ['Horizontal lines, like a notebook', 'Linhas horizontais, como um caderno'],
  'paper.plain': ['Plain', 'Liso'],
  'paper.plain.hint': ['No background at all', 'Sem fundo nenhum'],

  'edges.hand': ['Hand-drawn', 'Desenhadas à mão'],
  'edges.hand.hint': ['Wobbly borders, ruled inputs', 'Bordas tortinhas, campos pautados'],
  'edges.clean': ['Straight', 'Retas'],
  'edges.clean.hint': ['Plain boxes', 'Caixas simples'],

  'doodles.minimalist.hint': [
    'A leaf, dots, a tick, a flourish',
    'Uma folha, pontinhos, um tique, um floreio',
  ],
  'doodles.cozy.hint': [
    'Teapot, books, candle, jar of flowers',
    'Bule, livros, vela, jarro de flores',
  ],
  'doodles.whimsical.hint': [
    'Starbursts, loops, bunting, confetti',
    'Estrelas, voltas, bandeirinhas, confete',
  ],
  'doodles.botanical.hint': [
    'Fern, monstera, eucalyptus, acorns',
    'Samambaia, costela-de-adão, eucalipto, bolotas',
  ],
  'doodles.seaside.hint': [
    'Conch, palm, seaweed, a sailboat',
    'Búzio, palmeira, alga, um veleiro',
  ],
  'doodles.berry.hint': [
    'Cherries, grapes, blossom, vine',
    'Cerejas, uvas, flores, trepadeira',
  ],
  'doodles.typewriter.hint': [
    'Index cards, paperclips, a pencil',
    'Fichas, clipes, um lápis',
  ],
  'doodles.none': ['None', 'Nenhum'],
  'doodles.none.hint': ['Clean margins', 'Margens limpas'],

  'preset.minimalist': ['Minimalist', 'Minimalista'],
  'preset.minimalist.hint': [
    'Muted sage, rounded lettering, plants',
    'Sálvia suave, letra arredondada, plantas',
  ],
  'preset.cozy': ['Cozy', 'Aconchegante'],
  'preset.cozy.hint': [
    'Pastels, handwriting, every doodle',
    'Pastéis, letra de mão, todos os rabiscos',
  ],
  'preset.whimsical': ['Whimsical', 'Divertido'],
  'preset.whimsical.hint': [
    'Neon, sketchy capitals, pen marks',
    'Neon, maiúsculas rabiscadas, rabiscos de caneta',
  ],
  'preset.botanical': ['Botanical', 'Botânico'],
  'preset.botanical.hint': [
    'Forest green on ruled paper, serif',
    'Verde floresta em papel pautado, serifada',
  ],
  'preset.seaside': ['Seaside', 'Beira-mar'],
  'preset.seaside.hint': ['Teal and sand, rounded lettering', 'Turquesa e areia, letra arredondada'],
  'preset.berry': ['Berry', 'Amora'],
  'preset.berry.hint': ['Plum and dusty pink, handwriting', 'Ameixa e rosa antigo, letra de mão'],
  'preset.typewriter': ['Typewriter', 'Máquina de escrever'],
  'preset.typewriter.hint': ['Grey, typed, on ruled paper', 'Cinza, datilografado, em papel pautado'],
  'preset.modern': ['Modern', 'Moderno'],
  'preset.modern.hint': ['Plain, not a journal', 'Simples, não é um caderno'],
} as const satisfies Record<string, readonly [string, string]>

export type TKey = keyof typeof S

/** Presence labels are chosen by the same value the database stores. */
export const presenceKey = (p: string) => `presence.${p}` as TKey

/** Suggestions in the lesson-type box, translated but still free text. */
export const LESSON_TYPE_KEYS: TKey[] = [
  'lessonType.conversation',
  'lessonType.business',
  'lessonType.exam',
  'lessonType.general',
  'lessonType.grammar',
  'lessonType.kids',
  'lessonType.writing',
  'lessonType.other',
]

/** Everything the UI can say, in the language it should say it in. */
export function translate(
  lang: Lang,
  key: TKey,
  vars?: Record<string, string | number>,
): string {
  const text = S[key][lang === 'pt' ? 1 : 0]
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (whole, name) =>
    name in vars ? String(vars[name]) : whole,
  )
}

/* ----------------------------------------------------------- the live setting */

let current: Lang =
  (typeof localStorage !== 'undefined' && localStorage.getItem(LANG_KEY)) === 'pt' ? 'pt' : 'en'
const listeners = new Set<() => void>()

function applyLang(lang: Lang) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
}
applyLang(current)

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang) {
  if (lang === current) return
  current = lang
  localStorage.setItem(LANG_KEY, lang)
  applyLang(lang)
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * The language isn't in the zustand store on purpose: it has nothing to do with
 * her data, and every component needs it, including the sign-in page that
 * renders before the store exists.
 */
export function useT() {
  const lang = useSyncExternalStore(subscribe, getLang, getLang)
  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )
  return { t, lang, setLang }
}
