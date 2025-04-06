import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getPostBySlug, createMarkup, type WPPost } from "@/lib/wordpress-api";

export default function BlogPost() {
  const { slug } = useParams();
  
  const { data: post, isLoading, isError } = useQuery<WPPost>({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Post slug is required");
      try {
        return await getPostBySlug(slug);
      } catch (error) {
        console.error(`Error fetching WordPress post with slug "${slug}":`, error);
        throw error;
      }
    },
    enabled: slug !== undefined && false, // Disable until real API is connected by user, but enabled when slug is available
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/blog">
        <Button variant="ghost" className="mb-4 text-black hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all posts
        </Button>
      </Link>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
        </div>
      ) : isError ? (
        <div className="bg-white border border-black p-6 rounded-lg my-8 text-center">
          <h3 className="text-xl font-bold mb-2 text-black">Unable to load blog post</h3>
          <p className="text-black">The post you're looking for may not exist or there was an error loading it.</p>
        </div>
      ) : !post ? (
        <div className="bg-white border border-black p-6 rounded-lg my-8 text-center">
          <h3 className="text-xl font-bold mb-2 text-black">Post Not Found</h3>
          <p className="text-black">The post you're looking for does not exist.</p>
        </div>
      ) : (
        <article className="bg-white border border-black rounded-lg overflow-hidden">
          {post._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
            <div className="h-72 overflow-hidden">
              <img 
                src={post._embedded["wp:featuredmedia"][0].source_url} 
                alt={post.title.rendered}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4 text-black">{post.title.rendered}</h1>
            
            <div className="flex items-center mb-6 text-gray-700">
              <span>{formatDate(new Date(post.date))}</span>
              {post._embedded?.author && (
                <>
                  <span className="mx-2">•</span>
                  <span>By {post._embedded.author[0].name}</span>
                </>
              )}
            </div>
            
            <div 
              className="prose max-w-none text-black"
              dangerouslySetInnerHTML={createMarkup(post.content.rendered)} 
            />
          </div>
        </article>
      )}
    </div>
  );
}