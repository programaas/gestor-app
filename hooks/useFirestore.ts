import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, DocumentData, QuerySnapshot } from 'firebase/firestore';

// Define um tipo genérico para os documentos que inclua o ID
type WithId<T> = T & { id: string };

function useFirestore<T>(collectionName: string) {
    const [data, setData] = useState<WithId<T>[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Cria uma referência para a coleção do Firestore
        const colRef = collection(db, collectionName);

        // onSnapshot ouve em tempo real as mudanças na coleção
        const unsubscribe = onSnapshot(colRef, 
            (snapshot: QuerySnapshot<DocumentData>) => {
                // Mapeia os documentos do snapshot para o nosso tipo de dados
                const fetchedData = snapshot.docs.map(d => ({ ...d.data() as T, id: d.id }));
                setData(fetchedData);
                setLoading(false);
            }, 
            (err: Error) => {
                console.error(err);
                setError(err);
                setLoading(false);
            }
        );

        // Limpa a inscrição ao desmontar o componente para evitar vazamentos de memória
        return () => unsubscribe();
    }, [collectionName]); // O efeito é re-executado se o nome da coleção mudar

    // Função para adicionar um novo documento
    const addDocument = async (newData: T) => {
        try {
            const colRef = collection(db, collectionName);
            await addDoc(colRef, newData);
        } catch (err) {
            console.error("Erro ao adicionar documento:", err);
            // Opcional: poderia retornar o erro para tratamento no componente
        }
    };

    // Função para atualizar um documento existente
    const updateDocument = async (id: string, updatedData: Partial<T>) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedData);
        } catch (err) {
            console.error("Erro ao atualizar documento:", err);
        }
    };

    // Função para deletar um documento
    const deleteDocument = async (id: string) => {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        } catch (err) {
            console.error("Erro ao deletar documento:", err);
        }
    };

    return { data, loading, error, addDocument, updateDocument, deleteDocument };
}

export default useFirestore;
