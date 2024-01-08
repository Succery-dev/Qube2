import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Block, Trash } from '../../assets';
import Image from 'next/image';
import { getProjectDetails } from "../../contracts/Escrow";
import { getTokenDetails, formatTokenAmount } from "../../contracts/MockToken";
import { useAccount } from 'wagmi';
import { BigNumber } from 'ethers';

// ここで型定義やインターフェースを追加します
interface Contract {
  title: string;
  recipient: string;
  amount: string;
  token: string;
  submissionDeadline: string;
  reviewDeadline: string;
}

// これはダミーデータです。実際にはAPIからデータを取得するなどして埋める必要があります。
const contracts: Contract[] = [
  { title: "NFT Giveaway Tweet", recipient: "Badhan", amount: "300", token: "MATIC", submissionDeadline: "2023/12/20", reviewDeadline: "2023/12/27" },
  { title: "NFT Giveaway Tweet", recipient: "Badhan", amount: "300", token: "MATIC", submissionDeadline: "2023/12/20", reviewDeadline: "2023/12/27" },
  { title: "NFT Giveaway Tweet", recipient: "Badhan", amount: "300", token: "MATIC", submissionDeadline: "2023/12/20", reviewDeadline: "2023/12/27" },
  // 他のコントラクトデータ...
];

interface Member {
  name: string;
  email: string;
  walletAddress: string;
}

interface TokenDepositInfo {
  tokenAddress: string;
  depositAmount: BigNumber; // または number または BigNumber など、実際のデータ型に合わせて調整してください
}

interface ProjectDetails {
  owner: string;
  name: string;
  assignedUsers: string[]; // ユーザーアドレスの配列と仮定
  tokenDeposits: TokenDepositInfo[];
  taskIds: string[]; // タスクIDの配列と仮定
  startTimestamp: BigNumber; // Unixタイムスタンプと仮定
}

const Dashboard: NextPage = () => {
  const router = useRouter();
  const { isDisconnected } = useAccount();
  const { projectId } = router.query;

  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  // フォーマットされたトークンデポジット情報を格納するための状態変数
  const [formattedTokenDeposits, setFormattedTokenDeposits] = useState([]);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      const formattedDeposits = await Promise.all(
        projectDetails?.tokenDeposits.map(async (deposit) => {
          if (deposit.tokenAddress != "0x0000000000000000000000000000000000000000") {
            const { decimals, symbol } = await getTokenDetails(deposit.tokenAddress);
            const formattedAmount = formatTokenAmount(deposit.depositAmount, decimals);
            return { amount: formattedAmount, symbol };
          } else {
            const formattedAmount = formatTokenAmount(deposit.depositAmount, 18);
            return { amount: formattedAmount, symbol: "MATIC" };
          }
        })
      );
      setFormattedTokenDeposits(formattedDeposits);
    };

    if (projectDetails?.tokenDeposits) {
      fetchTokenDetails();
    }
  }, [projectDetails?.tokenDeposits]);

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        const response = await getProjectDetails(projectId as string);
        const details: ProjectDetails = {
          owner: response.owner,
          name: response.name,
          assignedUsers: response.assignedUsers,
          tokenDeposits: response.tokenDeposits.map(deposit => ({
            tokenAddress: deposit.tokenAddress,
            depositAmount: deposit.depositAmount,
          })),
          taskIds: response.taskIds,
          startTimestamp: response.startTimestamp,
        };
        setProjectDetails(details);
      } catch (error) {
        console.error('Could not fetch project details', error);
      }
    };

    if (projectId) {
      loadProjectDetails();
    }
  }, [projectId]);

  useEffect(() => {
    if (isDisconnected) {
      router.push("/");
    }
  }, [isDisconnected, router]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("hello");
    setIsModalOpen(false);
  };

  const [members, setMembers] = useState<Member[]>([
    {
      name: 'Badhan',
      email: 'badhan998877@gmail.com',
      walletAddress: '0x2Ed4a43bF11049c78E171A9c3F4A7ea1e6EDfBD4',
    },
    // 他のメンバーデータ...
  ]);

  // メンバーを削除する関数
  const removeMember = (index: number) => {
    setMembers(members => members.filter((_, i) => i !== index));
  };

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>

      {/* モーダルが開いている場合、背景をぼやけさせるバックドロップを表示 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg m-4 max-w-3xl w-full relative">
            {/* モーダルのヘッダー */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-center flex-1">Project Details</h2>
              <button 
                className="text-lg p-2" 
                onClick={closeModal} 
                aria-label="Close"
              >
                &times;
              </button>
            </div>
    
            {/* モーダルのコンテンツ */}
            <div>
              <div className="mb-4">
                <label className="block text-gray-700">Title</label>
                <div className="p-2 bg-gray-100 rounded-md text-gray-700">
                  {projectDetails?.name}
                </div>
              </div>
    
              <div className="mb-4">
                <label className="block text-gray-700">Members</label>
                <p className="text-slate-400">*Each member you add will be able to create task and get notification for every updates. other wont be able to see it too.</p>
                {/* メンバーリスト */}
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                      <span className='flex-1 truncate'>{member.name}</span>
                      <span className='flex-1 truncate'>{member.email}</span>
                      <span className='flex-1 truncate'>{member.walletAddress}</span>
                      <Image
                        src={Trash}
                        alt="trash"
                        height={30} 
                        onClick={() => removeMember(index)} 
                        className="ml-4 hover:bg-red-400 text-white p-1 rounded"
                        aria-label="Remove member"
                      />
                    </div>
                  ))}
                </div>
                {/* メンバー追加フォーム */}
                <div className="mt-4 flex items-center gap-5">
                  <input
                    type="text"
                    placeholder="Put the wallet address of the member..."
                    className="form-input flex-1 rounded-md border border-gray-200 px-5 py-3"
                  />
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-5 py-3">
                    Add Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white min-h-screen p-20">
        <div className="flex justify-between items-center mb-20">
          <button
            onClick={() => router.back()}
            className="text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1 rounded-md transition duration-300 ease-in-out"
          >
            Back
          </button>
          <div>
            <button 
              onClick={openModal}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {projectDetails?.name}
              <span className="ml-2">⚙️</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-6">{projectDetails?.name}</h1>

        <div className="flex">
          <div className="flex-1 bg-indigo-400 p-4 rounded-lg shadow-md text-white">
            <h3 className="font-semibold text-lg mb-2">BUDGET</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formattedTokenDeposits.map((deposit, index) => (
              <p key={index}>{deposit.amount} {deposit.symbol}</p>
            ))}
            </div>
          </div>
          <Image src={Block} alt="Block" height={300} className="hidden lg:block ml-10" />
        </div>

        <div className="flex justify-between items-center my-4">
          <h2 className="text-2xl font-semibold">Contracts</h2>
          <button className="text-indigo-600 hover:text-indigo-800">
            Add New +
          </button>
        </div>

        <div className="bg-slate-100 p-4 rounded-lg shadow-md">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-600">Contract</th>
                <th className="text-left text-gray-600">Name</th>
                <th className="text-left text-gray-600">Amount</th>
                <th className="text-left text-gray-600">Start Date</th>
                <th className="text-left text-gray-600">End Date</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract, index) => (
                <tr key={index} className="h-[50px] hover:shadow-lg duration-300">
                  <td>{contract.title}</td>
                  <td>{contract.recipient}</td>
                  <td>{contract.amount} {contract.token}</td>
                  <td>{contract.submissionDeadline}</td>
                  <td>{contract.reviewDeadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
