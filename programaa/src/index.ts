import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

// IMPORTANTE: Nunca coloque senhas diretamente no código.
// A senha de pânico será lida de uma variável de configuração segura do Firebase.
const PANIC_PASSWORD_SECRET = functions.config().panic?.password as
  | string
  | undefined;

/**
 * Deleta documentos em uma coleção em batches.
 * @param {admin.firestore.Firestore} db O objeto Firestore.
 * @param {admin.firestore.Query} query A query para selecionar os documentos.
 * @param {() => void} resolve Função de resolução da Promise.
 * @param {(reason?: any) => void} reject Função de rejeição da Promise.
 * @param {number} batchSize O número de documentos a serem deletados por batch.
 * @return {Promise<void>} Uma Promise que resolve quando os documentos são deletados.
 */
async function deleteQueryBatch(
  db: admin.firestore.Firestore,
  query: admin.firestore.Query,
  resolve: () => void,
  reject: (reason?: any) => void,
  batchSize: number
): Promise<void> {
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

    // Chama recursivamente esta função até que não haja mais documentos para deletar
    // Usa setTimeout para evitar estouro de pilha para coleções muito grandes
    if (snapshot.size === batchSize) {
      setTimeout(
        () => deleteQueryBatch(db, query, resolve, reject, batchSize),
        0
      );
    } else {
      resolve();
    }
  } catch (error) {
    reject(error);
  }
}

/**
 * Deleta uma coleção inteira do Firestore recursivamente.
 * @param {admin.firestore.Firestore} db O objeto Firestore.
 * @param {string} collectionPath O caminho da coleção a ser deletada.
 * @param {number} batchSize O número de documentos a serem deletados por batch.
 * @return {Promise<void>} Uma Promise que resolve quando a coleção é deletada.
 */
async function deleteCollection(
  db: admin.firestore.Firestore,
  collectionPath: string,
  batchSize: number
): Promise<void> {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise<void>((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject, batchSize).catch(reject);
  });
}

// --- A FUNÇÃO PRINCIPAL DE PÂNICO ---
/**
 * Função HTTP callable que aciona a exclusão de todos os dados do Firestore
 * se a senha de pânico correta for fornecida.
 * @param {any} data Os dados da requisição, contendo panicPassword.
 * @param {functions.https.CallableContext} context O contexto da requisição callable.
 * @return {Promise<object>} Um objeto contendo o status e uma mensagem.
 */
export const triggerPanicDelete = functions.https.onCall(
  async (data: any, context) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // 1. Verificação da Senha de Pânico
    // Acessamos panicPassword diretamente do objeto data
    const enteredPassword = (data?.panicPassword as string) || "";

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
        // O tamanho do batch é 100 documentos por vez para evitar exceder o limite de operações
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
        message:
          "Todos os dados foram deletados. O sistema será reiniciado sem informações.",
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
