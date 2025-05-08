import React, { useEffect, useState } from 'react';
import turnstile from './turnstile.png';
import './App.css';
import axios, { AxiosResponse } from 'axios';
import { toast, ToastContainer } from 'react-toastify';

const token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI1OGJlMDdmZi04NjY4LTRkMzgtOWM3Ni1jMGYzYjgwNWZlNTciLCJ1bmlxdWVfbmFtZSI6ItCV0LLQs9C10L3QuNGPINCY0L7Qu9C-0LLQuNGHINCQ0LvQtdC60YHQtdC10LLQvdCwIiwiZW1haWwiOiJpb2xvdmljaEB5YW5kZXgucnUiLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE3NDY1NDkxMTEsImV4cCI6MTc0OTE0MTExMSwiaWF0IjoxNzQ2NTQ5MTExLCJpc3MiOiJodHRwOi8vbWFuYWdlbWVudC1jbHVzdGVyaXAtc3J2OjgwIiwiYXVkIjoiKiJ9.VW7M93Dvjx41m71GHVQvxChpg6goLKxTIsN_nVedhrpgshiyZgjFTl3rtbMsCzh6SIB2ZtauohgtzUfhe9tCew";

export type GetClients = {
  pageNumber?: number,
  pageSize?: number
}

export type GetTurnstiles = {
  pageNumber?: number,
  pageSize?: number
}

export type GoThrough = {
  clientId: string,
  turnstileId: string,
  entryType: EntryType
}

export enum EntryType {
  Enter = 0,
  Exit = 1
}

export type FullNameDto = {
  firstName: string,
  secondName: string,
  patronymic?: string
}

export type ClientDto = {
  id: string,                  
  fullName: FullNameDto     
}

export type TurnstileDto = {
  id: string,
  name?: string | null,
  isMain: boolean,
  branchId: string,
  service?: ServiceDto | null,
  createdDate: Date,
  updatedDate?: Date | null
}

export type ServiceDto = {
  id: string,
  name: string 
}

export const getClientsAPI = async (params: GetClients): Promise<ClientDto[]> => {
  try {
    const response = await axios.get<ClientDto[]>(
      `${process.env.REACT_APP_MANAGEMENT_API}/clients`,
      { params }
    );
    
    const transformedData = response.data.map(item => ({
      id: item.id,
      fullName: {
        firstName: item.fullName.firstName,
        secondName: item.fullName.secondName,
        patronymic: item.fullName.patronymic
      }
    } as ClientDto));
    
    return transformedData;
  } catch (error) {
    throw error;
  }
}

export const getTurnstilesAPI = async(params: GetTurnstiles): Promise<AxiosResponse<TurnstileDto[]>> => {
  try{
      const data = await axios.get<TurnstileDto[]>(
          `${process.env.REACT_APP_ACCESS_CONTROL_API}/turnstiles`,
          {params}
      )
      return data
  } catch(error){
      throw error
  }
}

export const goTroughAPI = async(goThrough: GoThrough): Promise<AxiosResponse> => {
  try{
      const data = await axios.put(
          `${process.env.REACT_APP_ACCESS_CONTROL_API}/turnstiles/go-through`,
          goThrough
      )
      return data
  } catch(error){
      throw error
  }      
}

function App() {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [turnstiles, setTurnstiles] = useState<TurnstileDto[]>([]);
  const [turnstileId, setTurnstileId] = useState<string>('');
  const [entryType, setEntryType] = useState<EntryType>(EntryType.Enter);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchClients = async () => {
    try {
      const clients = await getClientsAPI({ pageNumber: 1, pageSize: 100 });
      setClients(clients);
    } catch (error) {
      toast.error('Ошибка загрузки клиентов');
    }
  };

  const fetchTurnstiles = async () => {
    try {
      const response = await getTurnstilesAPI({ pageNumber: 1, pageSize: 100 });
      setTurnstiles(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки турникетов');
    }
  };

  const handleGoThrough = async () => {
    if (!clientId || !turnstileId) {
      toast.warning('Выберите клиента и турникет');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await goTroughAPI({
        clientId,
        turnstileId,
        entryType
      });
      
      if (response.status === 200) {
        toast.success(
          `Клиент успешно ${entryType === EntryType.Enter ? 'вошёл' : 'вышел'}`
        );
      }
      else {
        toast.error(
          `Ошибка: клиент не ${
            entryType === EntryType.Enter ? 'вошёл' : 'вышел'
          }`
        );        
      }
    } catch (error) {
      toast.error(
        `Ошибка: клиент не ${
          entryType === EntryType.Enter ? 'вошёл' : 'вышел'
        }. ${(error as any).response.data.Errors[0].Message}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    fetchClients();
    fetchTurnstiles();
  }, []);

  return (
    <div className="app-container">
      <h1 className="app-title">Система контроля доступа</h1>
      
      <div className="controls-container">
        <div className="select-container">
          <label htmlFor="client-select">Клиент:</label>
          <select
            id="client-select"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="select-input"
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {`${client.fullName.secondName} ${client.fullName.firstName} ${
                  client.fullName.patronymic || ''
                }`}
              </option>
            ))}
          </select>
        </div>

        <div className="select-container">
          <label htmlFor="turnstile-select">Турникет:</label>
          <select
            id="turnstile-select"
            value={turnstileId}
            onChange={(e) => setTurnstileId(e.target.value)}
            className="select-input"
          >
            <option value="">Выберите турникет</option>
            {turnstiles.map((turnstile) => (
              <option key={turnstile.id} value={turnstile.id}>
                {turnstile.name || `Турникет ${turnstile.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="radio-container">
          <label>
            <input
              type="radio"
              checked={entryType === EntryType.Enter}
              onChange={() => setEntryType(EntryType.Enter)}
            />
            Вход
          </label>
          <label>
            <input
              type="radio"
              checked={entryType === EntryType.Exit}
              onChange={() => setEntryType(EntryType.Exit)}
            />
            Выход
          </label>
        </div>
      </div>

      <div className="turnstile-container">
        <img src={turnstile} alt="Турникет" className="turnstile-image" />
        {clientId && turnstileId && (
          <button
            onClick={handleGoThrough}
            disabled={isProcessing}
            className="go-button"
          >
            {isProcessing ? 'Обработка...' : 'Пройти'}
          </button>
        )}
      </div>
      <ToastContainer/>
    </div>
  );
}

export default App;