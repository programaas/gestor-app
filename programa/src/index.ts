import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

// IMPORTANTE: Nunca coloque senhas diretamente no código.
// A senha de pânico será lida de uma variável de configuração segura do Firebase.
// Usamos functions.config() para acessar variáveis de ambiente configuradas
// via `firebase functions:config:set`.
const PANIC_PASSWORD_SECRET = functions.config().panic?.password;

/**
 * Deleta documentos em uma coleção em batches.
 * Esta função é recursiva e garante que todos os documentos, incluindo
 * subcoleções, sejam deletados de forma eficiente.
 * @param db O objeto Firestore.
 * @param query A query para selecionar os documentos.
 * @param resolve Função de resolução da Promise.
 * @param reject Função de rejeição da Promise.
 */
async function deleteQueryBatch(
  db: admin.firestore.Firestore,
  query: admin.firestore.Query,
  resolve: () => void,
  reject: (reason?: unknown) => void
) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Chama recursivamente esta função até que não haja mais documentos
    // para deletar. Usa setTimeout para evitar estouro de pilha para
    // coleções muito grandes. Se o limite do batch foi atingido,
    // pode haver mais documentos para processar.
    if (snapshot.size === query.limit) {
      setTimeout(() => deleteQueryBatch(db, query, resolve, reject), 0);
    } else {
      resolve();
    }
  } catch (error) {
    reject(error);
  }
}

/**
 * Deleta uma coleção inteira do Firestore recursivamente.
 * @param db O objeto Firestore.
 * @param collectionPath O caminho da coleção a ser deletada.
 * @param batchSize O número de documentos a serem deletados por batch.
 * @return Uma Promise que resolve quando a coleção é deletada.
 */
async function deleteCollection(
  db: admin.firestore.Firestore,
  collectionPath: string,
  batchSize: number
) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject).catch(reject);
  });
}

/**
 * Função HTTP callable que aciona a exclusão de todos os dados do Firestore
 * se a senha de pânico correta for fornecida.
 * @param data Os dados da requisição, contendo panicPassword.
 * @param _context O contexto da requisição callable (não utilizado).
 * @return Um objeto contendo o status e uma mensagem.
 */
export const triggerPanicDelete = functions.https.onCall(
  async (data, _context) => {
    // 1. Verificação da Senha de Pânico
    const enteredPassword = data.panicPassword;

    // Certifique-se de que a variável de configuração foi definida
    if (!PANIC_PASSWORD_SECRET) {
      console.error("PANIC_PASSWORD_SECRET not set in Firebase config.");
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Panic password secret not configured on the server."
      );
    }

    if (!enteredPassword || enteredPassword !== PANIC_PASSWORD_SECRET) {
      console.warn("Attempted panic delete with incorrect password.");
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Senha de pânico incorreta ou não fornecida."
      );
    }

    // 2. Realizar a Exclusão dos Dados
    const firestore = admin.firestore();

    try {
      // Lista todas as coleções de nível superior
      const collections = await firestore.listCollections();

      // Cria um array de promessas para a exclusão de cada coleção
      const deletionPromises = collections.map(async (collectionRef) => {
        console.log(`Iniciando exclusão da coleção: ${collectionRef.id}`);
        // O tamanho do batch é 100 documentos por vez para evitar exceder
        // o limite de operações.
        await deleteCollection(firestore, collectionRef.id, 100);
        console.log(`Coleção ${collectionRef.id} deletada.`);
      });

      // Espera que todas as exclusões de coleções sejam concluídas
      await Promise.all(deletionPromises);

      console.log(
        "Todos os dados do Firestore foram deletados com sucesso via função de pânico."
      );
      return {
        status: "success",
        message: "Todos os dados foram deletados. " +
                 "O sistema será reiniciado sem informações.",
      };
    } catch (error) {
      console.error("Erro ao deletar dados do Firestore:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Ocorreu um erro ao tentar apagar os dados."
      );
    }
  }
);
